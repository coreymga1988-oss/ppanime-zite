import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids, requireProfile } from '../server/session';
import { MODERATOR_TABLES, tableClient, tableSchema } from '../server/adminTables';
import { getStripe, hasStripe } from '../server/stripe';

export default createEndpoint({
  description: 'Admin: deletes a record; deleting a user also removes their ads, pledges and subscription',
  authenticated: true,
  inputSchema: z.object({ table: tableSchema, id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const me = await requireProfile(context.user, ['Admin', 'Moderator']);
    if (me.role !== 'Admin' && !MODERATOR_TABLES.has(input.table))
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Moderator table', userFacingMessage: 'Only admins can manage this.' });
    if (input.table === 'profiles') {
      if (input.id === me.id) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Self delete', userFacingMessage: "You can't delete your own admin account here." });
      const p = await zite.profiles.findOne({ id: input.id });
      if (p?.role === 'Admin')
        throw new ZiteError({ code: 'BAD_REQUEST', message: 'Admin delete', userFacingMessage: "Admin accounts can't be deleted. Change their role first if they should no longer be an admin." });
      if (p) {
        if (p.stripeSubscriptionId && hasStripe()) {
          try { await getStripe().subscriptions.cancel(p.stripeSubscriptionId); } catch (e) { console.error(e); }
        }
        for (const adId of ids(p.ads)) await zite.ads.delete({ id: adId });
        const userId = ids(p.account)[0];
        if (userId) {
          const { records } = await zite.pledges.findAll({ filters: { backer: userId }, limit: 2000 });
          for (const pl of records) await zite.pledges.delete({ id: pl.id });
        }
      }
    }
    if (input.table === 'campaigns') {
      const c = await zite.campaigns.findOne({ id: input.id });
      for (const t of ids(c?.rewardTiers)) await zite.rewardTiers.delete({ id: t });
    }
    if (input.table === 'series') {
      const s = await zite.series.findOne({ id: input.id });
      for (const e of ids(s?.episodes)) await zite.episodes.delete({ id: e });
    }
    await tableClient(input.table).delete({ id: input.id });
    return { success: true };
  },
});
