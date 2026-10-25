import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids } from '../server/session';

const tier = z.object({ id: z.string(), name: z.string(), amount: z.number(), description: z.string(), limit: z.number().nullable(), claimed: z.number() });
const campaign = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  goal: z.number(),
  raised: z.number(),
  backers: z.number(),
  endDate: z.string(),
  status: z.string(),
  tiers: z.array(tier),
});

export default createEndpoint({
  description: 'Lists active and funded crowdfunding campaigns with progress and reward tiers',
  inputSchema: z.object({}),
  outputSchema: z.object({ campaigns: z.array(campaign) }),
  execute: async () => {
    const [{ records: camps }, { records: tiers }, { records: pledges }] = await Promise.all([
      zite.campaigns.findAll({ filters: { status: { in: ['Active', 'Funded'] } }, limit: 500 }),
      zite.rewardTiers.findAll({ limit: 2000 }),
      zite.pledges.findAll({ filters: { status: 'Paid' }, limit: 2000 }),
    ]);
    return {
      campaigns: camps.map((c) => {
        const ps = pledges.filter((p) => ids(p.campaign).includes(c.id));
        return {
          id: c.id,
          title: c.title ?? '',
          description: c.description ?? '',
          imageUrl: c.imageUrl ?? '',
          goal: c.goal ?? 0,
          raised: ps.reduce((s, p) => s + (p.amount ?? 0), 0),
          backers: ps.length,
          endDate: c.endDate ?? '',
          status: c.status ?? 'Active',
          tiers: tiers
            .filter((t) => ids(t.campaign).includes(c.id))
            .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))
            .map((t) => ({
              id: t.id,
              name: t.name ?? '',
              amount: t.amount ?? 0,
              description: t.description ?? '',
              limit: t.limit ?? null,
              claimed: ps.filter((p) => ids(p.rewardTier).includes(t.id)).length,
            })),
        };
      }),
    };
  },
});
