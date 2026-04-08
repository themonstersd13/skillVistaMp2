const {
  pgConfig,
  pool,
  query,
  getClient,
  connectPostgres,
  closePostgres,
} = require('./pgClient');
const {
  mongoose,
  mongoConfig,
  connectMongo,
  closeMongo,
} = require('./mongoClient');

module.exports = {
  pgConfig,
  pool,
  query,
  getClient,
  connectPostgres,
  closePostgres,
  mongoose,
  mongoConfig,
  connectMongo,
  closeMongo,
};
