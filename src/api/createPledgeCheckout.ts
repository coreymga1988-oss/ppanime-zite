import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids, requireProfile } from '../server/session';
import { getOrCreateCustomer, getStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Creates a Stripe checkout for backing a campaign',
  authenticated: true,
  inputSchema: z.object({ campaignId: z.string(), tierId: z.string().optional(), amount: z.number().min(1), returnUrl: z.string() }),
  outputSchema: z.object({ url: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user);
    const campaign = await zite.campaigns.findOne({ id: input.campaignId });
    if (!campaign || campaign.status !== 'Active')
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Not active', userFacingMessage: 'This campaign is not accepting pledges.' });
    let amount = input.amount;
    let tierName = 'Custom pledge';
    if (input.tierId) {
      const tier = await zite.rewardTiers.findOne({ id: input.tierId });
      if (!tier || !ids(tier.campaign).includes(campaign.id)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Bad tier' });
      amount = Math.max(amount, tier.amount ?? 0);
      tierName = tier.name ?? tierName;
    }
    const stripe = getStripe();
    const customer = await getOrCreateCustomer(stripe, context.user.email, profile.stripeCustomerId);
    if (!profile.stripeCustomerId) await zite.profiles.update({ id: profile.id, record: { stripeCustomerId: customer } });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(amount * 100), product_data: { name: `${campaign.title} — ${tierName}` } } }],
      success_url: `${input.returnUrl}?pledge={CHECKOUT_SESSION_ID}`,
      cancel_url: input.returnUrl,
    });
    await zite.pledges.create({
      record: {
        reference: `${campaign.title} · ${tierName}`,
        campaign: campaign.id,
        rewardTier: input.tierId ?? null,
        backer: context.user.id,
        amount,
        stripeSessionId: session.id,
        status: 'Pending',
      },
    });
    return { url: session.url! };
  },
});
