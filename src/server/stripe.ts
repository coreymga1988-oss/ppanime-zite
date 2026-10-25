import Stripe from 'stripe';
import { ZiteError } from 'zitejs/backend';

export const PREMIUM_PRICE_CENTS = 800;

export function hasStripe() {
  return !!process.env.ZITE_STRIPE_SECRET_KEY;
}

export function getStripe() {
  const key = process.env.ZITE_STRIPE_SECRET_KEY;
  if (!key)
    throw new ZiteError({
      code: 'BAD_REQUEST',
      message: 'ZITE_STRIPE_SECRET_KEY is not set',
      userFacingMessage: "Payments aren't switched on yet. Please check back soon!",
    });
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

export async function getOrCreateCustomer(stripe: Stripe, email: string, existingId?: string) {
  if (existingId) return existingId;
  const found = await stripe.customers.list({ email, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const c = await stripe.customers.create({ email });
  return c.id;
}
