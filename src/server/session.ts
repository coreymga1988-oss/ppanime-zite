import { zite, type ProfilesRecordType } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';

export type Role = 'Viewer' | 'Advertiser' | 'Licensor' | 'Moderator' | 'Admin';

export const ids = (v?: string | string[] | null): string[] => (!v ? [] : Array.isArray(v) ? v : [v]);

type CtxUser = { id: string; email: string; firstName?: string | null; lastName?: string | null } | null | undefined;

const randomCode = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)))
    .map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32])
    .join('');
export { randomCode };

export async function findProfile(userId: string) {
  return zite.profiles.findOne({ filters: { account: userId } });
}

export async function ensureProfile(user: NonNullable<CtxUser>): Promise<ProfilesRecordType> {
  const existing = await findProfile(user.id);
  if (existing) return existing;
  const { records: admins } = await zite.profiles.findAll({ filters: { role: 'Admin' }, limit: 1 });
  const base = (user.email.split('@')[0] || 'fan').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'fan';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return zite.profiles.create({
    record: {
      account: user.id,
      username: `${base}${Math.floor(Math.random() * 900 + 100)}`,
      displayName: name || base,
      role: admins.length === 0 ? 'Admin' : 'Viewer',
      tier: 'Free',
      status: 'Active',
      referralCode: randomCode(6),
    },
  });
}

/** Loads (or creates) the caller's profile and enforces role access + bans. */
export async function requireProfile(user: CtxUser, roles?: Role[]) {
  if (!user) throw new ZiteError({ code: 'UNAUTHORIZED', message: 'Sign in required', userFacingMessage: 'Please sign in first.' });
  const profile = await ensureProfile(user);
  if (profile.status === 'Banned')
    throw new ZiteError({ code: 'FORBIDDEN', message: 'Banned', userFacingMessage: 'This account has been suspended.' });
  if (roles && !roles.includes(profile.role as Role))
    throw new ZiteError({ code: 'FORBIDDEN', message: 'Wrong role', userFacingMessage: "You don't have access to this area." });
  return profile;
}

export async function getSetting(key: string, fallback = '') {
  const rec = await zite.siteSettings.findOne({ filters: { settingKey: key } });
  return rec?.value ?? fallback;
}
