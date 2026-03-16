import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string('DATABASE_URL is required').default('file:./dev.db'),
  PORT: z.coerce.number('PORT is required').default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  JWT_SECRET: z
    .string('JWT_SECRET is required')
    .min(32, 'JWT_SECRET must be at least 32 characters long'),

  MAIL_HOST: z.string('MAIL_HOST is required'),
  MAIL_PORT: z.coerce.number('MAIL_PORT is required'),
  MAIL_USER: z.string('MAIL_USER is required'),
  MAIL_PASS: z.string('MAIL_PASS is required'),
  REDIS_URL: z.string('REDIS_URL is required'),
});

export type Env = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.data;
};
