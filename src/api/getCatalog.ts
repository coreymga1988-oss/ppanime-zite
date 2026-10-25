import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids } from '../server/session';

const episode = z.object({
  id: z.string(),
  title: z.string(),
  episodeNumber: z.number(),
  description: z.string(),
  thumbnailUrl: z.string(),
  durationMinutes: z.number(),
  premiumOnly: z.boolean(),
});

export default createEndpoint({
  description: 'Lists published series with their episodes',
  inputSchema: z.object({}),
  outputSchema: z.object({
    series: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        synopsis: z.string(),
        coverImageUrl: z.string(),
        genres: z.string(),
        episodes: z.array(episode),
      }),
    ),
  }),
  execute: async () => {
    const [{ records: series }, { records: eps }] = await Promise.all([
      zite.series.findAll({ filters: { status: 'Published' }, limit: 2000 }),
      zite.episodes.findAll({ limit: 2000 }),
    ]);
    return {
      series: series.map((s) => ({
        id: s.id,
        title: s.title ?? 'Untitled',
        synopsis: s.synopsis ?? '',
        coverImageUrl: s.coverImageUrl ?? '',
        genres: s.genres ?? '',
        episodes: eps
          .filter((e) => ids(e.series).includes(s.id))
          .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
          .map((e) => ({
            id: e.id,
            title: e.title ?? '',
            episodeNumber: e.episodeNumber ?? 0,
            description: e.description ?? '',
            thumbnailUrl: e.thumbnailUrl ?? '',
            durationMinutes: e.durationMinutes ?? 0,
            premiumOnly: !!e.premiumOnly,
          })),
      })),
    };
  },
});
