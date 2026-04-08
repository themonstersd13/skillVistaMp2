const mongoose = require('mongoose');
const env = require('../config/env');

const mongoConfig = {
  uri: env.mongoUri,
  dbName: env.mongoDbName,
};

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoConfig.uri, {
    dbName: mongoConfig.dbName,
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
};

const closeMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/*
Sample MongoDB document shape for AI evaluation artifacts:
{
  "interviewId": "664f20d8d7c6f88b7e42b001",
  "userId": "664f20d8d7c6f88b7e42a900",
  "transcript": [
    {
      "speaker": "candidate",
      "text": "I would use a queue to decouple processing...",
      "timestampMs": 12500
    }
  ],
  "swot": {
    "strengths": ["Clear communication", "Strong DSA reasoning"],
    "weaknesses": ["Needs deeper system design vocabulary"],
    "opportunities": ["Practice architecture trade-off discussion"],
    "threats": ["Low consistency under time pressure"]
  },
  "geminiMeta": {
    "model": "gemini-1.5-pro",
    "processedAt": "2026-04-08T10:00:00.000Z"
  }
}
*/

module.exports = {
  mongoose,
  mongoConfig,
  connectMongo,
  closeMongo,
};
