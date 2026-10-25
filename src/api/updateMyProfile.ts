import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';

export default createEndpoint({
  description: 'Updates the signed-in person’s own profile details',
  authenticated: true,
  inputSchema: z.object({
    username: z.string().min(2).max(30),
    displayName: z.string().max(60),
    firstName: z.string().max(60),
    lastName: z.string().max(60),
    bio: z.string().max(1000),
    avatarUrl: z.string(),
    company: z.string().max(120),
    phone: z.string().max(40),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user);
    const username = input.username.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (username.length < 2) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Bad username', userFacingMessage: 'Usernames need at least 2 letters or numbers.' });
    const clash = await zite.profiles.findOne({ filters: { username } });
    if (clash && clash.id !== profile.id)
      throw new ZiteError({ code: 'CONFLICT', message: 'Username taken', userFacingMessage: 'That username is already taken.' });
    await zite.profiles.update({
      id: profile.id,
      record: {
        username,
        displayName: input.displayName.trim(),
        bio: input.bio,
        avatarUrl: input.avatarUrl || null,
        company: input.company,
        phone: input.phone || null,
      },
    });
    await zite.auth.updateUserProfile(context.user.id, {
      firstName: input.firstName.trim() || undefined,
      lastName: input.lastName.trim() || undefined,
      image: input.avatarUrl || undefined,
    });
    return { success: true };
  },
});
