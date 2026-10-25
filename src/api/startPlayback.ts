import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { findProfile, ids } from '../server/session';

const adSchema = z.object({ id: z.string(), title: z.string(), videoUrl: z.string(), clickUrl: z.string() });
type Ad = z.infer<typeof adSchema>;

/** Parses "5:30, 12:00, 900" into seconds. */
function parseTimes(raw: string | undefined): number[] {
  return (raw ?? '')
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.split(':').reduce((acc, p) => acc * 60 + Number(p), 0))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

export default createEndpoint({
  description: 'Starts playback of an episode: returns the video plus pre-, mid- and post-roll ads for free viewers',
  inputSchema: z.object({ episodeId: z.string() }),
  outputSchema: z.object({
    episode: z.object({ id: z.string(), title: z.string(), videoUrl: z.string(), seriesTitle: z.string(), seriesId: z.string(), episodeNumber: z.number() }),
    isPremium: z.boolean(),
    locked: z.boolean(),
    ad: adSchema.nullable(),
    midRolls: z.array(z.object({ at: z.number(), ad: adSchema })),
    postRoll: adSchema.nullable(),
  }),
  execute: async ({ input, context }) => {
    const ep = await zite.episodes.findOne({ id: input.episodeId });
    if (!ep) throw new ZiteError({ code: 'NOT_FOUND', message: 'Episode missing', userFacingMessage: 'Episode not found.' });
    const series = ids(ep.series)[0] ? await zite.series.findOne({ id: ids(ep.series)[0] }) : undefined;
    const profile = context.user ? await findProfile(context.user.id) : undefined;
    if (profile?.status === 'Banned') throw new ZiteError({ code: 'FORBIDDEN', message: 'Banned', userFacingMessage: 'This account has been suspended.' });
    const isPremium = profile?.tier === 'Premium' || profile?.role === 'Admin';
    const locked = !!ep.premiumOnly && !isPremium;

    let ad: Ad | null = null;
    let postRoll: Ad | null = null;
    const midRolls: { at: number; ad: Ad }[] = [];
    if (!isPremium && !locked) {
      const { records } = await zite.ads.findAll({ filters: { status: 'Approved' }, limit: 500 });
      const eligible = records.filter((a) => a.videoUrl && (a.deliveredViews ?? 0) < (a.targetViews ?? Infinity));
      const pick = (slot: string): Ad | null => {
        const pool = eligible.filter((a) => !a.placement || a.placement === 'Any' || a.placement === slot);
        const p = pool[Math.floor(Math.random() * pool.length)];
        return p ? { id: p.id, title: p.title ?? 'Sponsored', videoUrl: p.videoUrl!, clickUrl: p.clickUrl ?? '' } : null;
      };
      ad = pick('Pre-roll');
      for (const at of parseTimes(ep.midRollTimes)) {
        const m = pick('Mid-roll');
        if (m) midRolls.push({ at, ad: m });
      }
      if (!ep.disablePostRoll) postRoll = pick('Post-roll');
    }
    if (!locked) await zite.episodes.update({ id: ep.id, record: { views: (ep.views ?? 0) + 1 } });

    return {
      episode: {
        id: ep.id,
        title: ep.title ?? '',
        videoUrl: locked ? '' : ep.videoUrl ?? '',
        seriesTitle: series?.title ?? '',
        seriesId: series?.id ?? '',
        episodeNumber: ep.episodeNumber ?? 0,
      },
      isPremium,
      locked,
      ad,
      midRolls,
      postRoll,
    };
  },
});
