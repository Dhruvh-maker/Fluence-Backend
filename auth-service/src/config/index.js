import dotenv from 'dotenv';

dotenv.config();

export function getConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = Number(process.env.PORT || 4001);
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 100);

  const pg = {
    uri: process.env.PG_URI,
    host: process.env.PG_HOST || '161.248.37.208',
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || 'postgres',
    user: process.env.PG_USER || 'bp-user',
    password: process.env.PG_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
    ssl: (process.env.PG_SSL || 'false').toLowerCase() === 'true'
  };

  const jwt = {
    secret: process.env.JWT_SECRET || (nodeEnv === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'change_me'),
    expiresIn: process.env.JWT_EXPIRES_IN || (nodeEnv === 'production' ? '1h' : '1d')
  };

  return { nodeEnv, port, pg, jwt, rateLimitWindowMs, rateLimitMax };
}

