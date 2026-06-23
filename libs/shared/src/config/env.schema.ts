import * as yup from 'yup';

export const envSchema = yup.object({
  NODE_ENV: yup
    .string()
    .oneOf(['development', 'production', 'test'])
    .default('development'),
  PORT: yup.number().default(3000),
  API_PREFIX: yup.string().default('api'),
  DATABASE_URL: yup.string().required('Database URL is required'),
  JWT_SECRET: yup.string().default('super-secret-key'),
  JWT_COOKIE_NAME: yup.string().default('access_token'),
  BCRYPT_SALT_ROUNDS: yup.number().default(10),
});

export type EnvConfig = yup.InferType<typeof envSchema>;
