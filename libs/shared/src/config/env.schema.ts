import * as yup from 'yup';

export const envSchema = yup.object({
  NODE_ENV: yup
    .string()
    .oneOf(['development', 'production', 'test'])
    .default('development'),
  PORT: yup.number().default(3000),
  API_PREFIX: yup.string().default('api'),
});

export type EnvConfig = yup.InferType<typeof envSchema>;
