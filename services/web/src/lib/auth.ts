import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, apiKey } from 'better-auth/plugins';

import { db, authSchema } from '@/db';
import { env, isDevelopment } from '@/lib/env';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: isDevelopment,
    },
  },
  /**`nextCookies` plugin must be last */
  plugins: [
    organization(),
    apiKey({
      enableMetadata: true,
      rateLimit: {
        enabled: !isDevelopment,
        timeWindow: 1000 * 60 * 60,
        maxRequests: 1000,
      },
    }),
    nextCookies(),
  ],
});
