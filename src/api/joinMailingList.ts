import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Adds an email address to the Press Play mailing list',
  inputSchema: z.object({ email: z.string().email(), name: z.string().optional(), source: z.string().optional() }),
  outputSchema: z.object({ alreadySubscribed: z.boolean() }),
  execute: async ({ input }) => {
    const email = input.email.trim().toLowerCase();
    const existing = await zite.mailingList.findOne({ filters: { email } });
    if (existing) return { alreadySubscribed: true };
    await zite.mailingList.create({ record: { email, name: input.name ?? '', source: input.source ?? 'website' } });
    return { alreadySubscribed: false };
  },
});
