import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { requireProfile } from '../server/session';

const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  role: z.string(),
  tier: z.string(),
  status: z.string(),
  bio: z.string(),
  avatarUrl: z.string(),
  company: z.string(),
  phone: z.string(),
  referralCode: z.string(),
  hasSubscription: z.boolean(),
  joinedAt: z.string(),
});

export default createEndpoint({
  description: "Returns the signed-in person's profile, creating it on first visit",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({ profile: profileSchema }),
  execute: async ({ context }) => {
    const p = await requireProfile(context.user);
    return {
      profile: {
        id: p.id,
        username: p.username ?? '',
        displayName: p.displayName ?? '',
        email: context.user.email,
        role: p.role ?? 'Viewer',
        tier: p.tier ?? 'Free',
        status: p.status ?? 'Active',
        bio: p.bio ?? '',
        avatarUrl: p.avatarUrl ?? '',
        company: p.company ?? '',
        phone: p.phone ?? '',
        referralCode: p.referralCode ?? '',
        hasSubscription: !!p.stripeSubscriptionId,
        joinedAt: p.joinedAt ?? '',
      },
    };
  },
});
