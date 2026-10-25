import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';

const num = (v: unknown) => Number(v ?? 0) || 0;

export default createEndpoint({
  description: 'Admin: platform KPIs — MRR, ad revenue, pledges, users and views',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    premiumUsers: z.number(),
    freeUsers: z.number(),
    totalUsers: z.number(),
    mrr: z.number(),
    adRevenue: z.number(),
    adImpressions: z.number(),
    pendingAds: z.number(),
    pledgedTotal: z.number(),
    totalViews: z.number(),
    mailingList: z.number(),
    roleCounts: z.array(z.object({ role: z.string(), count: z.number() })),
    topSeries: z.array(z.object({ title: z.string(), views: z.number() })),
  }),
  execute: async ({ context }) => {
    await requireProfile(context.user, ['Admin']);
    const [users, roles, ads, pledges, views, mail, top] = await Promise.all([
      zite.sql({ query: `SELECT COUNT(*) FILTER (WHERE "tier" = 'Premium') AS premium, COUNT(*) AS total FROM "Profiles"` }),
      zite.sql({ query: `SELECT COALESCE("role", 'Viewer') AS role, COUNT(*) AS count FROM "Profiles" GROUP BY 1 ORDER BY 2 DESC` }),
      zite.sql({ query: `SELECT COALESCE(SUM(COALESCE("deliveredViews",0) * COALESCE("cpm",0) / 1000.0),0) AS revenue, COALESCE(SUM("deliveredViews"),0) AS impressions, COUNT(*) FILTER (WHERE "status" = 'Pending') AS pending FROM "Ads"` }),
      zite.sql({ query: `SELECT COALESCE(SUM("amount"),0) AS total FROM "Pledges" WHERE "status" = 'Paid'` }),
      zite.sql({ query: `SELECT COALESCE(SUM("views"),0) AS total FROM "Episodes"` }),
      zite.sql({ query: `SELECT COUNT(*) AS total FROM "MailingList"` }),
      zite.sql({
        query: `SELECT s."title" AS title, COALESCE(SUM(e."views"),0) AS views FROM "Series" s LEFT JOIN "Episodes" e ON s."id" = ANY(e."series") GROUP BY s."id", s."title" ORDER BY views DESC LIMIT 6`,
      }).catch(() => ({ rows: [] as Record<string, unknown>[] })),
    ]);
    const premium = num(users.rows[0]?.premium);
    const total = num(users.rows[0]?.total);
    return {
      premiumUsers: premium,
      freeUsers: total - premium,
      totalUsers: total,
      mrr: premium * 8,
      adRevenue: num(ads.rows[0]?.revenue),
      adImpressions: num(ads.rows[0]?.impressions),
      pendingAds: num(ads.rows[0]?.pending),
      pledgedTotal: num(pledges.rows[0]?.total),
      totalViews: num(views.rows[0]?.total),
      mailingList: num(mail.rows[0]?.total),
      roleCounts: roles.rows.map((r) => ({ role: String(r.role), count: num(r.count) })),
      topSeries: top.rows.map((r) => ({ title: String(r.title ?? ''), views: num(r.views) })),
    };
  },
});
