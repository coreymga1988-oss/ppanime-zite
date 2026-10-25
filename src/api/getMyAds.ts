import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';

export default createEndpoint({
  description: "Lists the signed-in advertiser's ads with delivery stats",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    ads: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        videoUrl: z.string(),
        clickUrl: z.string(),
        targetViews: z.number(),
        deliveredViews: z.number(),
        budget: z.number(),
        cpm: z.number(),
        status: z.string(),
        adminFeedback: z.string(),
        contactName: z.string(),
        contactEmail: z.string(),
        contactPhone: z.string(),
        notes: z.string(),
        submittedAt: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const profile = await requireProfile(context.user, ['Advertiser', 'Admin']);
    const { records } = await zite.ads.findAll({ filters: { advertiser: profile.id }, limit: 500 });
    return {
      ads: records
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
        .map((a) => ({
          id: a.id,
          title: a.title ?? '',
          videoUrl: a.videoUrl ?? '',
          clickUrl: a.clickUrl ?? '',
          targetViews: a.targetViews ?? 0,
          deliveredViews: a.deliveredViews ?? 0,
          budget: a.budget ?? 0,
          cpm: a.cpm ?? 0,
          status: a.status ?? 'Pending',
          adminFeedback: a.adminFeedback ?? '',
          contactName: a.contactName ?? '',
          contactEmail: a.contactEmail ?? '',
          contactPhone: a.contactPhone ?? '',
          notes: a.notes ?? '',
          submittedAt: a.submittedAt ?? '',
        })),
    };
  },
});
