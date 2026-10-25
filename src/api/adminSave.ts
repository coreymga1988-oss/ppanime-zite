import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { randomCode, requireProfile } from '../server/session';
import { MODERATOR_TABLES, tableClient, tableSchema } from '../server/adminTables';
import { getStripe, hasStripe } from '../server/stripe';

const COMPUTED = new Set(['id', 'createdAt', 'joinedAt', 'submittedAt', 'subscribedAt', 'email', 'firstName', 'lastName']);

export default createEndpoint({
  description: 'Admin: creates or updates any record in any table',
  authenticated: true,
  inputSchema: z.object({ table: tableSchema, id: z.string().optional(), record: z.record(z.string(), z.any()) }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const me = await requireProfile(context.user, ['Admin', 'Moderator']);
    if (me.role !== 'Admin' && !MODERATOR_TABLES.has(input.table))
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Moderator table', userFacingMessage: 'Only admins can manage this.' });
    const record: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input.record)) if (!COMPUTED.has(k) && !(input.table === 'profiles' && k === 'email')) record[k] = v === '' ? null : v;

    if (input.table === 'profiles' && input.id === me.id && record.role && record.role !== 'Admin')
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Self demote', userFacingMessage: "You can't remove your own admin role." });

    if (input.table === 'invites' && !input.id) {
      record.code = (record.code as string) || randomCode(8);
      record.status = record.status || 'Pending';
    }
    if (input.table === 'coupons') {
      if (record.code) record.code = String(record.code).toUpperCase().trim();
      if (!input.id && hasStripe() && (record.percentOff || record.amountOff)) {
        const stripe = getStripe();
        const duration = (record.duration as 'once' | 'repeating' | 'forever') || 'once';
        const coupon = await stripe.coupons.create({
          name: String(record.code ?? 'Coupon'),
          duration,
          ...(duration === 'repeating' ? { duration_in_months: Number(record.durationMonths) || 1 } : {}),
          ...(record.percentOff ? { percent_off: Number(record.percentOff) } : { amount_off: Math.round(Number(record.amountOff) * 100), currency: 'usd' }),
          ...(record.maxRedemptions ? { max_redemptions: Number(record.maxRedemptions) } : {}),
        });
        record.stripeCouponId = coupon.id;
      }
    }
    if (input.table === 'profiles' && record.tier === 'Free') {
      const existing = input.id ? await zite.profiles.findOne({ id: input.id }) : undefined;
      if (existing?.stripeSubscriptionId && hasStripe() && input.record.cancelStripe) {
        await getStripe().subscriptions.cancel(existing.stripeSubscriptionId);
        record.stripeSubscriptionId = null;
      }
    }
    delete record.cancelStripe;

    const client = tableClient(input.table);
    if (input.id) {
      await client.update({ id: input.id, record });
      return { id: input.id };
    }
    const created = await client.create({ record });
    return { id: String(created.id) };
  },
});
