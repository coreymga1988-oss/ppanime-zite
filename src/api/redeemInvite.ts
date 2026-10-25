import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/session';

export default createEndpoint({
  description: 'Redeems an invite code to give the signed-in person an Advertiser, Licensor or Admin account',
  authenticated: true,
  inputSchema: z.object({ code: z.string() }),
  outputSchema: z.object({ role: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user);
    const code = input.code.trim().toUpperCase();
    const invite = await zite.invites.findOne({ filters: { code } });
    if (!invite || invite.status !== 'Pending')
      throw new ZiteError({ code: 'NOT_FOUND', message: 'Invalid invite', userFacingMessage: 'That invite code is invalid or has already been used.' });
    if (invite.email && invite.email.toLowerCase() !== context.user.email.toLowerCase())
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Email mismatch', userFacingMessage: `This invite was sent to ${invite.email}. Sign in with that email to redeem it.` });
    await zite.profiles.update({
      id: profile.id,
      record: { role: invite.role ?? 'Viewer', company: invite.company || profile.company || null },
    });
    await zite.invites.update({ id: invite.id, record: { status: 'Accepted', acceptedBy: context.user.id } });
    return { role: invite.role ?? 'Viewer' };
  },
});
