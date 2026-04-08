const { Worker } = require('bullmq');
const { query } = require('../database/pgClient');
const { transcribeAudio } = require('../services/transcriptionService');
const { storeTranscriptRawData } = require('../services/mongoStorageService');
const { evaluateInterviewJob } = require('./geminiEvaluator');
const {
  QUEUE_NAMES,
  JOB_NAMES,
  WORKER_EVENTS,
  createRedisConnection,
  queueEventBus,
} = require('./queue');

const WORKER_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const updateProcessingState = async ({ interviewId, jobId }) => {
  await query(
    `
      UPDATE evaluation_status
      SET
        status = $2,
        queue_job_id = $3,
        processing_started_at = NOW(),
        error_message = NULL,
        updated_at = NOW()
      WHERE interview_id = $1
    `,
    [interviewId, WORKER_STATUS.PROCESSING, String(jobId)]
  );

  await query(
    `
      UPDATE interviews
      SET started_at = COALESCE(started_at, NOW()), updated_at = NOW()
      WHERE id = $1
    `,
    [interviewId]
  );
};

const fetchInterviewContext = async (interviewId) => {
  const result = await query(
    `
      SELECT
        i.id,
        i.title,
        i.interview_type,
        i.academic_year,
        i.user_id,
        i.faculty_user_id,
        r.role_key
      FROM interviews i
      INNER JOIN users u ON u.id = i.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE i.id = $1
      LIMIT 1
    `,
    [interviewId]
  );

  return result.rows[0] || null;
};

const updateCompletedState = async ({ interviewId, transcriptMongoId }) => {
  await query(
    `
      UPDATE evaluation_status
      SET
        status = $2,
        processing_completed_at = NOW(),
        updated_at = NOW()
      WHERE interview_id = $1
    `,
    [interviewId, WORKER_STATUS.COMPLETED]
  );

  await query(
    `
      UPDATE interviews
      SET
        completed_at = NOW(),
        updated_at = NOW(),
        transcript_mongo_id = COALESCE(transcript_mongo_id, $2)
      WHERE id = $1
    `,
    [interviewId, transcriptMongoId]
  );
};

const updateFailedState = async ({ interviewId, errorMessage, attemptsMade }) => {
  await query(
    `
      UPDATE evaluation_status
      SET
        status = $2,
        error_message = $3,
        retry_count = $4,
        updated_at = NOW()
      WHERE interview_id = $1
    `,
    [interviewId, WORKER_STATUS.FAILED, errorMessage, Math.max((attemptsMade || 1) - 1, 0)]
  );
};

const processAudioJob = async (job) => {
  const { interviewId, userId, audioPath, audioMimeType } = job.data;
  const interviewContext = await fetchInterviewContext(interviewId);

  await updateProcessingState({
    interviewId,
    jobId: job.id,
  });

  queueEventBus.emit(WORKER_EVENTS.PROCESSING, {
    interviewId,
    jobId: String(job.id),
    userId,
    facultyId: interviewContext && interviewContext.faculty_user_id,
    status: WORKER_STATUS.PROCESSING,
    timestamp: new Date().toISOString(),
  });

  const transcriptionResult = await transcribeAudio({
    audioPath,
    mimeType: audioMimeType,
  });

  const transcriptDocument = await storeTranscriptRawData({
    interviewId,
    userId,
    role: interviewContext && interviewContext.role_key,
    currentYear: interviewContext && interviewContext.academic_year,
    title: interviewContext && interviewContext.title,
    interviewType: interviewContext && interviewContext.interview_type,
    transcriptText: transcriptionResult.transcriptText,
    transcriptMeta: transcriptionResult.transcriptMeta,
    rawSegments: [
      {
        speaker: 'candidate',
        text: transcriptionResult.transcriptText,
        timestampMs: 0,
      },
    ],
  });

  const evaluationDocument = await evaluateInterviewJob({
    interviewId,
    userId,
    transcriptText: transcriptionResult.transcriptText,
    transcriptMeta: transcriptionResult.transcriptMeta,
    academicYear: interviewContext && interviewContext.academic_year,
    interviewTitle: interviewContext && interviewContext.title,
    interviewType: interviewContext && interviewContext.interview_type,
    jobId: String(job.id),
    facultyId: interviewContext && interviewContext.faculty_user_id,
  });

  await updateCompletedState({
    interviewId,
    transcriptMongoId: transcriptDocument.id,
  });

  const result = {
    interviewId,
    jobId: String(job.id),
    status: WORKER_STATUS.COMPLETED,
    transcriptText: transcriptionResult.transcriptText,
    transcriptMeta: transcriptionResult.transcriptMeta,
    transcriptDocumentId: transcriptDocument.id,
    evaluationDocumentId: evaluationDocument.id,
    readinessScore: evaluationDocument.result && evaluationDocument.result.readinessScore,
  };

  queueEventBus.emit(WORKER_EVENTS.COMPLETED, {
    ...result,
    userId,
    facultyId: interviewContext && interviewContext.faculty_user_id,
    timestamp: new Date().toISOString(),
  });

  return result;
};

const workerConnection = createRedisConnection();

const audioProcessingWorker = new Worker(
  QUEUE_NAMES.INTERVIEW_PROCESSING,
  async (job) => {
    if (job.name !== JOB_NAMES.PROCESS_INTERVIEW_AUDIO) {
      throw new Error(`Unsupported job name: ${job.name}`);
    }

    return processAudioJob(job);
  },
  {
    connection: workerConnection,
    concurrency: 2,
  }
);

audioProcessingWorker.on('failed', async (job, error) => {
  if (!job) {
    return;
  }

  const interviewId = job.data && job.data.interviewId;
  const interviewContext = interviewId ? await fetchInterviewContext(interviewId).catch(() => null) : null;

  await updateFailedState({
    interviewId,
    errorMessage: error.message,
    attemptsMade: job.attemptsMade + 1,
  }).catch(() => null);

  queueEventBus.emit(WORKER_EVENTS.FAILED, {
    interviewId,
    jobId: String(job.id),
    userId: job.data && job.data.userId,
    facultyId: interviewContext && interviewContext.faculty_user_id,
    status: WORKER_STATUS.FAILED,
    error: error.message,
    attemptsMade: job.attemptsMade + 1,
    timestamp: new Date().toISOString(),
  });
});

audioProcessingWorker.on('error', (error) => {
  process.stderr.write(`Audio worker error: ${error.message}\n`);
});

module.exports = {
  audioProcessingWorker,
  processAudioJob,
};
