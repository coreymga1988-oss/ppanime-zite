import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids, requireProfile } from '../server/session';
import { MODERATOR_TABLES, findAllRecords, tableSchema } from '../server/adminTables';

export default createEndpoint({
  description: 'Admin: lists every record in a table (profiles include login email)',
  authenticated: true,
  inputSchema: z.object({ table: tableSchema }),
  outputSchema: z.object({ records: z.array(z.record(z.string(), z.any())) }),
  execute: async ({ input, context }) => {
    const me = await requireProfile(context.user, ['Admin', 'Moderator']);
    if (me.role !== 'Admin' && !MODERATOR_TABLES.has(input.table))
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Moderator table', userFacingMessage: 'Only admins can view this.' });
    const records = await findAllRecords(input.table);
    if (input.table === 'profiles') {
      const { records: users } = await zite.auth.findAllUsers({ limit: 2000 });
      const byId = new Map(users.map((u) => [u.id, u]));
      return {
        records: records.map((r) => {
          const u = byId.get(ids(r.account as string | string[])[0] ?? '');
          return { ...r, email: u?.email ?? '', firstName: u?.firstName ?? '', lastName: u?.lastName ?? '' };
        }),
      };
    }
    return { records };
  },
});
