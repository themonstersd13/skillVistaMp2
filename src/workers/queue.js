const EventEmitter = require('events');
const { Queue, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');

const QUEUE_NAMES = {
  INTERVIEW_PROCESSING: 'interview-processing',
};

const JOB_NAMES = {
  PROCESS_INTERVIEW_AUDIO: 'process-interview-audio',
};

const WORKER_EVENTS = {
  PROCESSING: 'interview.processing',
  COMPLETED: 'interview.completed',
  FAILED: 'interview.failed',
};

const createRedisConnection = () =>
  new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
  });

const connection = createRedisConnection();
const queueEventsConnection = createRedisConnection();

const queueEventBus = new EventEmitter();
queueEventBus.setMaxListeners(50);

const interviewQueue = new Queue(QUEUE_NAMES.INTERVIEW_PROCESSING, {
  connection,
});

const interviewQueueEvents = new QueueEvents(QUEUE_NAMES.INTERVIEW_PROCESSING, {
  connection: queueEventsConnection,
});

connection.on('error', (error) => {
  process.stderr.write(`Redis queue connection error: ${error.message}\n`);
});

queueEventsConnection.on('error', (error) => {
  process.stderr.write(`Redis queue events connection error: ${error.message}\n`);
});

interviewQueueEvents.on('error', (error) => {
  process.stderr.write(`BullMQ queue events error: ${error.message}\n`);
});

module.exports = {
  QUEUE_NAMES,
  JOB_NAMES,
  WORKER_EVENTS,
  connection,
  createRedisConnection,
  queueEventBus,
  interviewQueue,
  interviewQueueEvents,
};
