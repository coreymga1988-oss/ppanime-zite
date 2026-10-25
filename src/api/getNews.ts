import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lists published news posts',
  inputSchema: z.object({}),
  outputSchema: z.object({
    posts: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), imageUrl: z.string(), createdAt: z.string() })),
  }),
  execute: async () => {
    const { rows } = await zite.sql({
      query: `SELECT "id","title","body","imageUrl","createdAt" FROM "NewsPosts" WHERE "published" = true ORDER BY "createdAt" DESC LIMIT 100`,
    });
    return {
      posts: rows.map((r) => ({
        id: String(r.id),
        title: String(r.title ?? ''),
        body: String(r.body ?? ''),
        imageUrl: String(r.imageUrl ?? ''),
        createdAt: String(r.createdAt ?? ''),
      })),
    };
  },
});
