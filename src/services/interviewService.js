const fs = require('fs');
const { getClient, query } = require('../database/pgClient');
const { interviewQueue, JOB_NAMES } = require('../workers/queue');
const { HTTP_STATUS } = require('../config/constants');
const ErrorResponse = require('../utils/errorResponse');
const { saveInterviewAudio } = require('./uploadService');

const YEAR_MAP = {
  FY: 1,
  SY: 2,
  TY: 3,
  LY: 4,
};

const STATUS_LABELS = {
  queued: 'queued',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
};

const formatInterview = (row) => {
  if (!row) {
    return null;
  }

  return {
    interviewId: row.id,
    title: row.title,
    interviewType: row.interview_type,
    academicYear: row.academic_year,
    audioFileName: row.audio_file_name,
    audioStorageKey: row.audio_storage_key,
    overallScore: row.overall_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const createInterviewSubmission = async ({ file, body, user }) => {
  const savedFile = await saveInterviewAudio({
    file,
    userId: user.id || user.sub,
  });

  const client = await getClient();
  let interview;

  try {
    await client.query('BEGIN');

    const interviewInsertResult = await client.query(
      `
        INSERT INTO interviews (
          user_id,
          title,
          interview_type,
          academic_year,
          audio_file_name,
          audio_storage_key
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          title,
          interview_type,
          academic_year,
          audio_file_name,
          audio_storage_key,
          overall_score,
          created_at,
          updated_at
      `,
      [
        user.id || user.sub,
        body.title || 'Interview Submission',
        body.interviewType || 'mock',
        body.year ? YEAR_MAP[body.year] : null,
        savedFile.fileName,
        savedFile.relativePath,
      ]
    );

    interview = interviewInsertResult.rows[0];

    await client.query(
      `
        INSERT INTO evaluation_status (interview_id, status)
        VALUES ($1, $2)
      `,
      [interview.id, STATUS_LABELS.queued]
    );

    await client.query('COMMIT');

    const queueJob = await interviewQueue.add(
      JOB_NAMES.PROCESS_INTERVIEW_AUDIO,
      {
        interviewId: interview.id,
        userId: user.id || user.sub,
        audioPath: savedFile.relativePath,
        audioMimeType: savedFile.mimeType,
        audioSize: savedFile.size,
      },
      {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      }
    );

    await query(
      `
        UPDATE evaluation_status
        SET queue_job_id = $2, updated_at = NOW()
        WHERE interview_id = $1
      `,
      [interview.id, String(queueJob.id)]
    );

    return {
      interview: formatInterview(interview),
      interviewId: interview.id,
      jobId: String(queueJob.id),
      queueStatus: STATUS_LABELS.queued,
      file: {
        fileName: savedFile.fileName,
        storageKey: savedFile.relativePath,
      },
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      process.stderr.write(`Interview transaction rollback failed: ${rollbackError.message}\n`);
    }

    if (interview && interview.id) {
      await query(
        `
          UPDATE evaluation_status
          SET status = $2, error_message = $3, updated_at = NOW()
          WHERE interview_id = $1
        `,
        [interview.id, STATUS_LABELS.failed, error.message]
      ).catch(() => null);
    }

    if (savedFile && savedFile.absolutePath) {
      await fs.promises.unlink(savedFile.absolutePath).catch(() => null);
    }

    throw error;
  } finally {
    client.release();
  }
};

const getInterviewStatusById = async ({ interviewId, user }) => {
  const result = await query(
    `
      SELECT
        i.id,
        i.user_id,
        i.title,
        i.interview_type,
        i.academic_year,
        i.audio_file_name,
        i.audio_storage_key,
        i.overall_score,
        i.created_at,
        i.updated_at,
        es.status,
        es.queue_job_id,
        es.error_message,
        es.processing_started_at,
        es.processing_completed_at
      FROM interviews i
      LEFT JOIN evaluation_status es ON es.interview_id = i.id
      WHERE i.id = $1
      LIMIT 1
    `,
    [interviewId]
  );

  if (result.rowCount === 0) {
    throw new ErrorResponse('Interview not found.', HTTP_STATUS.NOT_FOUND);
  }

  const interview = result.rows[0];
  const requesterId = user.id || user.sub;
  const requesterRole = user.role;

  if (requesterRole === 'student' && interview.user_id !== requesterId) {
    throw new ErrorResponse('You do not have permission to access this interview.', HTTP_STATUS.FORBIDDEN);
  }

  return {
    ...formatInterview(interview),
    queueStatus: interview.status,
    jobId: interview.queue_job_id,
    errorMessage: interview.error_message,
    processingStartedAt: interview.processing_started_at,
    processingCompletedAt: interview.processing_completed_at,
  };
};

module.exports = {
  createInterviewSubmission,
  getInterviewStatusById,
};
