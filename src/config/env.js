const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const parseNumber = (value, fallback) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  pgHost: process.env.PG_HOST || 'localhost',
  pgPort: parseNumber(process.env.PG_PORT, 5432),
  pgDatabase: process.env.PG_DATABASE || 'skillvista',
  pgUser: process.env.PG_USER || 'postgres',
  pgPassword: process.env.PG_PASSWORD || 'postgres',
  pgSsl: String(process.env.PG_SSL || 'false').toLowerCase() === 'true',
  pgPoolMin: parseNumber(process.env.PG_POOL_MIN, 0),
  pgPoolMax: parseNumber(process.env.PG_POOL_MAX, 10),
  pgIdleTimeoutMs: parseNumber(process.env.PG_IDLE_TIMEOUT_MS, 10000),
  pgConnectionTimeoutMs: parseNumber(process.env.PG_CONNECTION_TIMEOUT_MS, 5000),
  pgConnectionString:
    process.env.PG_CONNECTION_STRING ||
    'postgresql://postgres:postgres@localhost:5432/skillvista',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/skillvista',
  mongoDbName: process.env.MONGO_DB_NAME || 'skillvista',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  maxFileSizeMb: parseNumber(process.env.MAX_FILE_SIZE_MB, 25),
};

const requiredInProduction = ['JWT_SECRET', 'MONGO_URI', 'REDIS_URL'];

if (env.nodeEnv === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);

  const hasPgConnectionString = Boolean(process.env.PG_CONNECTION_STRING);
  const hasPgDiscreteConfig = Boolean(
    process.env.PG_HOST &&
      process.env.PG_PORT &&
      process.env.PG_DATABASE &&
      process.env.PG_USER &&
      process.env.PG_PASSWORD
  );

  if (!hasPgConnectionString && !hasPgDiscreteConfig) {
    missing.push('PG_CONNECTION_STRING or PG_HOST/PG_PORT/PG_DATABASE/PG_USER/PG_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = env;
