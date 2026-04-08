require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const healthRoutes = require('./gateway/routes/healthRoutes');
const authRoutes = require('./gateway/routes/authRoutes');
const interviewRoutes = require('./gateway/routes/interviewRoutes');
const analyticsRoutes = require('./gateway/routes/analyticsRoutes');
const { notFoundHandler, errorMiddleware } = require('./gateway/middlewares/errorMiddleware');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300;

app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

module.exports = app;
