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
  KAFKA_BROKER: yup.string().default('localhost:9092'),
  KAFKA_ORDERS_GROUP: yup.string().default('orders-consumer-group'),
  KAFKA_INVENTORY_GROUP: yup.string().default('inventory-consumer-group'),
  KAFKA_CLIENT_ALLOW_AUTO_TOPIC_CREATION: yup.boolean().default(true),
  KAFKA_CONSUMER_ALLOW_AUTO_TOPIC_CREATION: yup.boolean().default(true),
  KAFKA_RETRY_INITIAL_RETRY_TIME: yup.number().default(300),
  KAFKA_RETRY_RETRIES: yup.number().default(5),
  KAFKA_SESSION_TIMEOUT: yup.number().default(30000),
  KAFKA_HEARTBEAT_INTERVAL: yup.number().default(3000),
  KAFKA_REBALANCE_TIMEOUT: yup.number().default(60000),
});

export type EnvConfig = yup.InferType<typeof envSchema>;
