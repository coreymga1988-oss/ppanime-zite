import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';

const CHANNEL_ID = 'UCEXmgoj7TLrTb1OJtkgTAxw';
const UPLOADS = 'VLUU' + CHANNEL_ID.slice(2);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36';

type Video = { id: string; title: string; duration: string; thumbnail: string };

function walk(o: unknown, out: Video[], conts: string[]) {
  if (Array.isArray(o)) return o.forEach((v) => walk(v, out, conts));
  if (!o || typeof o !== 'object') return;
  const obj = o as Record<string, any>;
  if (obj.lockupViewModel) {
    const l = obj.lockupViewModel;
    const id = l.contentId as string;
    const title = l.metadata?.lockupMetadataViewModel?.title?.content ?? '';
    const badge = JSON.stringify(l.contentImage ?? {}).match(/"text":"(\d+:\d+(?::\d+)?)"/);
    if (id && l.contentType?.includes('VIDEO')) out.push({ id, title, duration: badge?.[1] ?? '', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
  }
  if (obj.playlistVideoRenderer) {
    const r = obj.playlistVideoRenderer;
    out.push({ id: r.videoId, title: r.title?.runs?.[0]?.text ?? '', duration: r.lengthText?.simpleText ?? '', thumbnail: `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg` });
  }
  if (obj.continuationCommand?.token) conts.push(obj.continuationCommand.token);
  for (const v of Object.values(obj)) walk(v, out, conts);
}

async function browse(body: Record<string, unknown>) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20261009.01.00', hl: 'en' } }, ...body }),
  });
  if (!res.ok) throw new Error(`YouTube responded ${res.status}`);
  return res.json();
}

async function viaApiKey(key: string): Promise<Video[]> {
  const out: Video[] = [];
  let page = '';
  do {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=UU${CHANNEL_ID.slice(2)}&key=${key}${page ? `&pageToken=${page}` : ''}`);
    const j: any = await r.json();
    for (const it of j.items ?? []) {
      const id = it.snippet?.resourceId?.videoId;
      if (id) out.push({ id, title: it.snippet.title, duration: '', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
    }
    page = j.nextPageToken ?? '';
  } while (page);
  return out;
}

export default createEndpoint({
  description: 'Fetches every public upload from the Press Play YouTube channel, live',
  inputSchema: z.object({}),
  outputSchema: z.object({
    channelId: z.string(),
    videos: z.array(z.object({ id: z.string(), title: z.string(), duration: z.string(), thumbnail: z.string() })),
  }),
  execute: async () => {
    let videos: Video[] = [];
    const key = process.env.ZITE_YOUTUBE_API_KEY;
    if (key) {
      try { videos = await viaApiKey(key); } catch (e) { console.error('API key fetch failed', e); }
    }
    if (videos.length === 0) {
      const conts: string[] = [];
      walk(await browse({ browseId: UPLOADS }), videos, conts);
      let guard = 0;
      while (conts.length && guard++ < 40) {
        const token = conts.shift()!;
        const next: string[] = [];
        walk(await browse({ continuation: token }), videos, next);
        conts.push(...next);
      }
    }
    const seen = new Set<string>();
    videos = videos.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
    return { channelId: CHANNEL_ID, videos };
  },
});
