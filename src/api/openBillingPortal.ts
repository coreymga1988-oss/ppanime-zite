import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';
import { getOrCreateCustomer, getStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Opens the Stripe billing portal to manage payment methods, invoices and cancellation',
  authenticated: true,
  inputSchema: z.object({ returnUrl: z.string() }),
  outputSchema: z.object({ url: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user);
    const stripe = getStripe();
    const customer = await getOrCreateCustomer(stripe, context.user.email, profile.stripeCustomerId);
    if (!profile.stripeCustomerId) await zite.profiles.update({ id: profile.id, record: { stripeCustomerId: customer } });
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: input.returnUrl });
    return { url: portal.url };
  },
});
