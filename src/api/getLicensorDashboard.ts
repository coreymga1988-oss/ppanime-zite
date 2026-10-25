import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { getSetting, ids, requireProfile } from '../server/session';

export default createEndpoint({
  description: "Returns view counts and revenue share for the signed-in licensor's series only",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    revenuePerView: z.number(),
    series: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        coverImageUrl: z.string(),
        status: z.string(),
        revenueShare: z.number(),
        views: z.number(),
        grossRevenue: z.number(),
        licensorRevenue: z.number(),
        episodes: z.array(z.object({ id: z.string(), title: z.string(), episodeNumber: z.number(), views: z.number() })),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const profile = await requireProfile(context.user, ['Licensor', 'Admin']);
    const revenuePerView = Number(await getSetting('revenue_per_view', '0.01')) || 0.01;
    const { records: series } = await zite.series.findAll({ filters: { licensor: profile.id }, limit: 500 });
    const out: {
      id: string; title: string; coverImageUrl: string; status: string; revenueShare: number; views: number;
      grossRevenue: number; licensorRevenue: number; episodes: { id: string; title: string; episodeNumber: number; views: number }[];
    }[] = [];
    for (const s of series) {
      const { records: allEps } = await zite.episodes.findAll({ filters: { series: s.id }, limit: 2000 });
      const eps = allEps.filter((e) => ids(e.series).includes(s.id));
      const views = eps.reduce((sum, e) => sum + (e.views ?? 0), 0);
      const gross = views * revenuePerView;
      out.push({
        id: s.id,
        title: s.title ?? '',
        coverImageUrl: s.coverImageUrl ?? '',
        status: s.status ?? 'Draft',
        revenueShare: s.revenueShare ?? 0,
        views,
        grossRevenue: gross,
        licensorRevenue: gross * (s.revenueShare ?? 0),
        episodes: eps
          .map((e) => ({ id: e.id, title: e.title ?? '', episodeNumber: e.episodeNumber ?? 0, views: e.views ?? 0 }))
          .sort((a, b) => a.episodeNumber - b.episodeNumber),
      });
    }
    return { revenuePerView, series: out };
  },
});
