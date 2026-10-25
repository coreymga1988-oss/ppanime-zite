import { z } from 'zod';

export const ADMIN_TABLES = [
  'profiles',
  'series',
  'episodes',
  'ads',
  'campaigns',
  'rewardTiers',
  'pledges',
  'newsPosts',
  'coupons',
  'invites',
  'mailingList',
  'siteSettings',
] as const;

export const tableSchema = z.enum(ADMIN_TABLES);
export type AdminTable = (typeof ADMIN_TABLES)[number];

/** Tables Moderators may manage (content, ads, crowdfunding, news). Everything else is Admin-only. */
export const MODERATOR_TABLES: ReadonlySet<AdminTable> = new Set(['series', 'episodes', 'ads', 'campaigns', 'rewardTiers', 'newsPosts']);

type Client = {
  findAll: (p: { limit?: number; offset?: number }) => Promise<{ records: Record<string, unknown>[]; hasMore: boolean }>;
  findOne: (p: { id: string }) => Promise<Record<string, unknown> | undefined>;
  create: (p: { record: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  update: (p: { id: string; record: Record<string, unknown> }) => Promise<unknown>;
  delete: (p: { id: string }) => Promise<unknown>;
};

import { zite } from 'zitejs/db';
export const tableClient = (t: AdminTable) => (zite as unknown as Record<string, Client>)[t];

export async function findAllRecords(t: AdminTable) {
  const out: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    const { records, hasMore } = await tableClient(t).findAll({ limit: 2000, offset });
    out.push(...records);
    if (!hasMore || records.length === 0) break;
    offset += records.length;
  }
  return out;
}
