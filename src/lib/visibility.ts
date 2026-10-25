export const SECTIONS = [
  { key: 'youtube', label: 'YouTube Videos', description: 'Embedded videos from our YouTube channel' },
  { key: 'browse', label: 'Series Catalog', description: 'Licensed series & episodes' },
  { key: 'campaigns', label: 'Crowdfunding', description: 'Back a project campaigns' },
  { key: 'news', label: 'News Feed', description: 'Announcements & updates' },
  { key: 'premium', label: 'Premium Upgrade', description: 'Subscription page & upsells' },
  { key: 'about', label: 'About Press Play', description: 'Who we are & partner info' },
  { key: 'mailing', label: 'Mailing List Signup', description: 'Newsletter form in the footer' },
  { key: 'socials', label: 'Social Links', description: 'Social icons in the footer' },
] as const;

export const AUDIENCES = [
  { key: 'guest', label: 'Not signed in' },
  { key: 'free', label: 'Free viewers' },
  { key: 'premium', label: 'Premium viewers' },
  { key: 'licensor', label: 'Licensors' },
  { key: 'advertiser', label: 'Advertisers' },
] as const;

export type SectionKey = (typeof SECTIONS)[number]['key'];
export type Audience = (typeof AUDIENCES)[number]['key'] | 'admin';
export type Visibility = Record<string, Record<string, boolean>>;

export function defaultVisibility(): Visibility {
  const v: Visibility = {};
  for (const s of SECTIONS) {
    v[s.key] = {};
    for (const a of AUDIENCES) v[s.key][a.key] = !(s.key === 'premium' && a.key !== 'free' && a.key !== 'guest');
  }
  return v;
}

export function parseVisibility(raw?: string): Visibility {
  const base = defaultVisibility();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Visibility;
    for (const s of Object.keys(base)) base[s] = { ...base[s], ...(parsed[s] ?? {}) };
  } catch {
    /* fall back to defaults */
  }
  return base;
}
