import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { findProfile, ids } from '../server/session';
import { getStripe, hasStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Deletes the signed-in person’s account data, ads and pledges, and cancels any subscription',
  authenticated: true,
  inputSchema: z.object({ confirm: z.literal('DELETE') }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ context }) => {
    const profile = await findProfile(context.user.id);
    if (!profile) return { success: true };
    if (profile.role === 'Admin')
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Admin self-delete', userFacingMessage: "Admin accounts can't be deleted." });
    if (profile.stripeSubscriptionId && hasStripe()) {
      try {
        await getStripe().subscriptions.cancel(profile.stripeSubscriptionId);
      } catch (e) {
        console.error('Cancel failed', e);
      }
    }
    for (const adId of ids(profile.ads)) await zite.ads.delete({ id: adId });
    const { records: pledges } = await zite.pledges.findAll({ filters: { backer: context.user.id }, limit: 2000 });
    for (const pl of pledges) await zite.pledges.delete({ id: pl.id });
    await zite.profiles.delete({ id: profile.id });
    return { success: true };
  },
});
