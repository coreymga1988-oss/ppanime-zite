import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';
import { getStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Re-checks the signed-in viewer’s Stripe subscription and syncs their Free/Premium tier',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({ tier: z.string() }),
  execute: async ({ context }) => {
    const profile = await requireProfile(context.user);
    if (!profile.stripeSubscriptionId) return { tier: profile.tier ?? 'Free' };
    const sub = await getStripe().subscriptions.retrieve(profile.stripeSubscriptionId);
    const active = ['active', 'trialing', 'past_due'].includes(sub.status);
    const tier = active ? 'Premium' : 'Free';
    await zite.profiles.update({ id: profile.id, record: { tier, stripeSubscriptionId: active ? sub.id : null } });
    return { tier };
  },
});
