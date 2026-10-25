import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { ids, requireProfile } from '../server/session';

export default createEndpoint({
  description: 'Creates or edits an advertiser’s ad; edits send it back for admin approval',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    action: z.enum(['save', 'pause', 'resume', 'delete']),
    title: z.string().optional(),
    videoUrl: z.string().optional(),
    clickUrl: z.string().optional(),
    targetViews: z.number().optional(),
    budget: z.number().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await requireProfile(context.user, ['Advertiser', 'Admin']);
    const existing = input.id ? await zite.ads.findOne({ id: input.id }) : undefined;
    if (input.id && (!existing || !ids(existing.advertiser).includes(profile.id)))
      throw new ZiteError({ code: 'NOT_FOUND', message: 'Ad not found', userFacingMessage: 'Ad not found.' });

    if (existing && input.action === 'delete') {
      await zite.ads.delete({ id: existing.id });
      return { id: existing.id };
    }
    if (existing && input.action === 'pause') {
      await zite.ads.update({ id: existing.id, record: { status: 'Paused' } });
      return { id: existing.id };
    }
    if (existing && input.action === 'resume') {
      await zite.ads.update({ id: existing.id, record: { status: 'Pending' } });
      return { id: existing.id };
    }
    if (!input.title || !input.videoUrl || !input.targetViews)
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Missing fields', userFacingMessage: 'Title, video and target views are required.' });
    const record = {
      title: input.title,
      videoUrl: input.videoUrl,
      clickUrl: input.clickUrl || null,
      targetViews: input.targetViews,
      budget: input.budget ?? 0,
      contactName: input.contactName ?? '',
      contactEmail: input.contactEmail || context.user.email,
      contactPhone: input.contactPhone || null,
      notes: input.notes ?? '',
      status: 'Pending',
    };
    if (existing) {
      await zite.ads.update({ id: existing.id, record });
      return { id: existing.id };
    }
    const created = await zite.ads.create({ record: { ...record, advertiser: profile.id, deliveredViews: 0, cpm: 10 } });
    return { id: created.id };
  },
});
