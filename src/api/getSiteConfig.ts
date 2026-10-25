import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Returns public site settings such as section visibility and the beta notice',
  inputSchema: z.object({}),
  outputSchema: z.object({ settings: z.record(z.string(), z.string()) }),
  execute: async () => {
    const { records } = await zite.siteSettings.findAll({ limit: 200 });
    const settings: Record<string, string> = {};
    for (const r of records) if (r.settingKey) settings[r.settingKey] = r.value ?? '';
    return { settings };
  },
});
