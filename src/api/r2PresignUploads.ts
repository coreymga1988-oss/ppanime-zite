import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireProfile } from '../server/session';

const clean = (p: string) => p.replace(/\\/g, '/').split('/').filter((s) => s && s !== '.' && s !== '..').join('/');

export default createEndpoint({
  description: 'Admin: creates signed upload links so episode files go straight to Cloudflare R2',
  authenticated: true,
  inputSchema: z.object({
    folder: z.string(),
    files: z.array(z.object({ path: z.string(), contentType: z.string() })).max(200),
  }),
  outputSchema: z.object({
    uploads: z.array(z.object({ path: z.string(), key: z.string(), url: z.string() })),
    publicBase: z.string(),
  }),
  execute: async ({ input, context }) => {
    await requireProfile(context.user, ['Admin', 'Moderator']);
    const folder = clean(input.folder);
    if (!folder) throw new ZiteError({ code: 'BAD_REQUEST', message: 'No folder', userFacingMessage: 'Enter a destination folder.' });

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.ZITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.ZITE_R2_ACCESS_KEY_ID, secretAccessKey: process.env.ZITE_R2_SECRET_ACCESS_KEY },
    });
    const uploads = await Promise.all(
      input.files.map(async (f) => {
        const key = `${folder}/${clean(f.path)}`;
        const url = await getSignedUrl(
          s3,
          new PutObjectCommand({ Bucket: process.env.ZITE_R2_BUCKET, Key: key, ContentType: f.contentType }),
          { expiresIn: 3600 },
        );
        return { path: f.path, key, url };
      }),
    );
    return { uploads, publicBase: process.env.ZITE_R2_PUBLIC_URL.replace(/\/+$/, '') };
  },
});
