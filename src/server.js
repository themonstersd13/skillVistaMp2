require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeWebsocket } = require('./services/websocketService');

const PORT = Number(process.env.PORT) || 5000;
const corsOrigin = process.env.CORS_ORIGIN || '*';
const httpServer = http.createServer(app);

initializeWebsocket(httpServer, corsOrigin);

httpServer.listen(PORT, () => {
  process.stdout.write(`SkillVista backend listening on port ${PORT}.\n`);
});
