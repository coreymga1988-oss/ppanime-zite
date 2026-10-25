import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FolderUp, Loader2, Copy } from 'lucide-react';
import { adminList, adminSave, r2PresignUploads } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Progress } from '@project/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@project/components/ui/card';

const TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', m4s: 'video/iso.segment', mp4: 'video/mp4',
  m4a: 'audio/mp4', aac: 'audio/aac', vtt: 'text/vtt', jpg: 'image/jpeg', png: 'image/png',
};
const typeOf = (name: string) => TYPES[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';
// Drop the picked folder's own name so files land directly under the destination folder
const relPath = (f: File) => (f.webkitRelativePath || f.name).split('/').slice(f.webkitRelativePath ? 1 : 0).join('/');

type Ep = { id: string; label: string };

export default function R2Uploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [folder, setFolder] = useState('');
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [episodes, setEpisodes] = useState<Ep[]>([]);
  const [episodeId, setEpisodeId] = useState<string>();

  useEffect(() => {
    adminList({ table: 'episodes' }).then(({ records }) =>
      setEpisodes(records.map((r) => ({ id: String(r.id), label: `E${r.episodeNumber ?? '?'} · ${r.title ?? 'Untitled'}` }))),
    ).catch(() => undefined);
  }, []);

  const master = useMemo(() => {
    const paths = files.map(relPath);
    const lists = paths.filter((p) => p.toLowerCase().endsWith('.m3u8'));
    if (!lists.length) return paths.find((p) => /\.(mp4|m4v|mov|webm)$/i.test(p));
    return lists.find((p) => /master|index|main|playlist/i.test(p) && !p.includes('/')) ?? lists.find((p) => !p.includes('/')) ?? lists[0];
  }, [files]);
  const totalMb = files.reduce((s, f) => s + f.size, 0) / 1e6;

  const upload = async () => {
    setBusy(true); setDone(0); setResultUrl('');
    try {
      let publicBase = '';
      for (let i = 0; i < files.length; i += 100) {
        const batch = files.slice(i, i + 100);
        const res = await r2PresignUploads({ folder, files: batch.map((f) => ({ path: relPath(f), contentType: typeOf(f.name) })) });
        publicBase = res.publicBase;
        // 6 uploads at a time
        const queue = batch.map((f, j) => ({ f, u: res.uploads[j] }));
        await Promise.all(Array.from({ length: 6 }, async () => {
          for (let item = queue.shift(); item; item = queue.shift()) {
            const r = await fetch(item.u.url, { method: 'PUT', body: item.f, headers: { 'Content-Type': typeOf(item.f.name) } });
            if (!r.ok) throw new Error(`${relPath(item.f)} failed (${r.status})`);
            setDone((d) => d + 1);
          }
        }));
      }
      const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
      const url = master ? `${publicBase}/${cleanFolder}/${master}` : `${publicBase}/${cleanFolder}/`;
      setResultUrl(url);
      if (episodeId && master) {
        await adminSave({ table: 'episodes', id: episodeId, record: { videoUrl: url } });
        toast.success('Uploaded and attached to the episode');
      } else toast.success('Upload complete');
    } catch (e) {
      toast.error(e instanceof Error && e.message === 'Failed to fetch'
        ? 'The bucket blocked the upload. Check the CORS rule allows PUT from this site.'
        : e instanceof Error ? e.message : 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FolderUp className="h-5 w-5 text-primary" />Upload episode to R2</CardTitle>
        <CardDescription>Upload an MP4 or an HLS folder straight to your R2 bucket.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>1 · Choose what to upload</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-lg border border-dashed border-border p-4 cursor-pointer hover:border-primary transition-colors">
              <span className="font-medium text-sm">Single video file (MP4)</span>
              <span className="block text-xs text-muted-foreground mt-1">Simplest. One audio track, no dub/sub switch.</span>
              <input type="file" accept="video/mp4,video/*" className="hidden" disabled={busy}
                onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setDone(0); setResultUrl(''); e.target.value = ''; }} />
            </label>
            <label className="rounded-lg border border-dashed border-border p-4 cursor-pointer hover:border-primary transition-colors">
              <span className="font-medium text-sm">HLS folder (.m3u8)</span>
              <span className="block text-xs text-muted-foreground mt-1">From ffmpeg. Supports dub/sub audio switching.</span>
              <input type="file" multiple className="hidden" disabled={busy} {...({ webkitdirectory: '', directory: '' } as object)}
                onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setDone(0); setResultUrl(''); e.target.value = ''; }} />
            </label>
          </div>
          {files.length > 0 && (
            <p className="text-sm text-muted-foreground">{files.length} file{files.length > 1 ? 's' : ''} · {totalMb.toFixed(1)} MB · plays from: {master ?? <span className="text-destructive">no .m3u8 or video file found</span>}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>2 · Destination folder in the bucket</Label>
          <Input placeholder="my-series/ep01" value={folder} disabled={busy} onChange={(e) => setFolder(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>3 · Attach to episode (optional)</Label>
          <p className="text-xs text-muted-foreground">Saves the uploaded video's link as that episode's video, so it plays on its watch page right away. Leave blank to just upload and copy the link yourself.</p>
          <Select value={episodeId} onValueChange={setEpisodeId} disabled={busy}>
            <SelectTrigger><SelectValue placeholder="Don't attach, just upload" /></SelectTrigger>
            <SelectContent>{episodes.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {(busy || done > 0) && <div className="space-y-1"><Progress value={(done / Math.max(files.length, 1)) * 100} /><p className="text-xs text-muted-foreground">{done} / {files.length} files</p></div>}
        <Button onClick={upload} disabled={busy || !files.length || !folder.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderUp className="h-4 w-4" />}Upload
        </Button>
        {resultUrl && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate flex-1">{resultUrl}</span>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(resultUrl); toast('Link copied'); }}><Copy className="h-3 w-3" /></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
