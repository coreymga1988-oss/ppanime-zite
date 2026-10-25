import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Records one delivered view of a pre-roll ad',
  inputSchema: z.object({ adId: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const ad = await zite.ads.findOne({ id: input.adId });
    if (!ad || ad.status !== 'Approved') return { success: false };
    const delivered = (ad.deliveredViews ?? 0) + 1;
    await zite.ads.update({ id: ad.id, record: { deliveredViews: delivered } });
    return { success: true };
  },
});
