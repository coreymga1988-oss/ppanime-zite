import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { getStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Confirms a returning Stripe checkout (pledge or Premium subscription) and records it',
  authenticated: true,
  inputSchema: z.object({ sessionId: z.string() }),
  outputSchema: z.object({ kind: z.enum(['pledge', 'subscription', 'unpaid']) }),
  execute: async ({ input, context }) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') return { kind: 'unpaid' as const };
    if (session.mode === 'subscription') {
      const profile = await zite.profiles.findOne({ filters: { account: context.user.id } });
      if (profile) {
        await zite.profiles.update({
          id: profile.id,
          record: { tier: 'Premium', stripeSubscriptionId: String(session.subscription ?? ''), premiumSince: new Date().toISOString() },
        });
        const code = session.metadata?.couponId;
        if (code) {
          const c = await zite.coupons.findOne({ id: code });
          if (c) await zite.coupons.update({ id: c.id, record: { timesRedeemed: (c.timesRedeemed ?? 0) + 1 } });
        }
      }
      return { kind: 'subscription' as const };
    }
    const pledge = await zite.pledges.findOne({ filters: { stripeSessionId: session.id } });
    if (pledge && pledge.status !== 'Paid') await zite.pledges.update({ id: pledge.id, record: { status: 'Paid' } });
    return { kind: 'pledge' as const };
  },
});
