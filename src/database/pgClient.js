const { Pool } = require('pg');
const env = require('../config/env');

const pgConfig = process.env.PG_CONNECTION_STRING
  ? {
      connectionString: env.pgConnectionString,
      min: env.pgPoolMin,
      max: env.pgPoolMax,
      idleTimeoutMillis: env.pgIdleTimeoutMs,
      connectionTimeoutMillis: env.pgConnectionTimeoutMs,
      ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host: env.pgHost,
      port: env.pgPort,
      database: env.pgDatabase,
      user: env.pgUser,
      password: env.pgPassword,
      min: env.pgPoolMin,
      max: env.pgPoolMax,
      idleTimeoutMillis: env.pgIdleTimeoutMs,
      connectionTimeoutMillis: env.pgConnectionTimeoutMs,
      ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(pgConfig);

pool.on('error', (error) => {
  process.stderr.write(`PostgreSQL pool error: ${error.message}\n`);
});

const connectPostgres = async () => {
  const client = await pool.connect();
  client.release();
  return pool;
};

const query = (text, params) => {
  return pool.query(text, params);
};

const getClient = () => {
  return pool.connect();
};

const closePostgres = async () => {
  await pool.end();
};

module.exports = {
  pgConfig,
  pool,
  query,
  getClient,
  connectPostgres,
  closePostgres,
};
