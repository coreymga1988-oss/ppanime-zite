import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';
import { getOrCreateCustomer, getStripe, PREMIUM_PRICE_CENTS } from '../server/stripe';

export default createEndpoint({
  description: 'Starts the $8/month Premium subscription checkout, applying a coupon or referral code',
  authenticated: true,
  inputSchema: z.object({ code: z.string().optional(), returnUrl: z.string() }),
  outputSchema: z.object({ url: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user);
    if (profile.tier === 'Premium')
      throw new ZiteError({ code: 'CONFLICT', message: 'Already premium', userFacingMessage: "You're already Premium!" });
    const stripe = getStripe();
    const customer = await getOrCreateCustomer(stripe, context.user.email, profile.stripeCustomerId);
    if (!profile.stripeCustomerId) await zite.profiles.update({ id: profile.id, record: { stripeCustomerId: customer } });

    let discounts: { promotion_code?: string; coupon?: string }[] | undefined;
    let couponId = '';
    const code = input.code?.trim().toUpperCase();
    if (code) {
      let coupon = await zite.coupons.findOne({ filters: { code } });
      const referrer = coupon ? undefined : await zite.profiles.findOne({ filters: { referralCode: code } });
      if (referrer && referrer.id !== profile.id) {
        coupon = (await zite.coupons.findAll({ filters: { kind: 'Referral', active: true }, limit: 1 })).records[0];
        await zite.profiles.update({ id: profile.id, record: { referredBy: referrer.username ?? code } });
      }
      if (!coupon || !coupon.active || !coupon.stripeCouponId)
        throw new ZiteError({ code: 'BAD_REQUEST', message: 'Bad code', userFacingMessage: "That code isn't valid." });
      if (coupon.maxRedemptions && (coupon.timesRedeemed ?? 0) >= coupon.maxRedemptions)
        throw new ZiteError({ code: 'BAD_REQUEST', message: 'Used up', userFacingMessage: 'That code has been fully redeemed.' });
      discounts = [{ coupon: coupon.stripeCouponId }];
      couponId = coupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: { currency: 'usd', unit_amount: PREMIUM_PRICE_CENTS, recurring: { interval: 'month' }, product_data: { name: 'Press Play Premium' } },
        },
      ],
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      metadata: { couponId },
      success_url: `${input.returnUrl}?checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: input.returnUrl,
    });
    return { url: session.url! };
  },
});
