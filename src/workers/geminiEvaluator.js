const { query } = require('../database/pgClient');
const { evaluateWithGemini } = require('../services/geminiService');
const {
  getTranscriptByInterviewId,
  storeGeminiEvaluationResult,
} = require('../services/mongoStorageService');
const { buildEvaluationPrompt } = require('../utils/promptBuilder');

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
        r.role_key,
        es.status,
        es.queue_job_id
      FROM interviews i
      INNER JOIN users u ON u.id = i.user_id
      INNER JOIN roles r ON r.id = u.role_id
      LEFT JOIN evaluation_status es ON es.interview_id = i.id
      WHERE i.id = $1
      LIMIT 1
    `,
    [interviewId]
  );

  return result.rows[0] || null;
};

const updateEvaluationReference = async ({ interviewId, evaluationId }) => {
  await query(
    `
      UPDATE evaluation_status
      SET evaluation_mongo_id = $2, updated_at = NOW()
      WHERE interview_id = $1
    `,
    [interviewId, evaluationId]
  );
};

const evaluateInterviewJob = async ({
  interviewId,
  userId,
  transcriptText,
  transcriptMeta,
  academicYear,
  interviewTitle,
  interviewType,
  jobId,
  facultyId,
}) => {
  let context = {
    id: interviewId,
    title: interviewTitle,
    interview_type: interviewType,
    academic_year: academicYear,
    user_id: userId,
    faculty_user_id: facultyId,
  };

  if (interviewId) {
    const dbContext = await fetchInterviewContext(interviewId);

    if (dbContext) {
      context = dbContext;
    }
  }

  const promptContext = buildEvaluationPrompt({
    transcriptText,
    academicYear: context.academic_year || academicYear,
    interviewTitle: context.title || interviewTitle,
    interviewType: context.interview_type || interviewType,
  });

  const geminiResult = await evaluateWithGemini({
    prompt: promptContext.prompt,
  });

  const transcriptDocument =
    interviewId ? await getTranscriptByInterviewId(interviewId).catch(() => null) : null;

  const storedEvaluation = await storeGeminiEvaluationResult({
    interviewId: interviewId || context.id || null,
    userId: userId || context.user_id || null,
    role: context.role_key,
    currentYear: promptContext.academicYear,
    transcriptRefId: transcriptDocument && transcriptDocument.id,
    evaluation: {
      ...geminiResult.evaluation,
      yearProfile: promptContext.yearProfile,
    },
    geminiMeta: {
      model: geminiResult.model,
      generatedAt: new Date().toISOString(),
      promptAcademicYear: promptContext.academicYear,
    },
  });

  if (interviewId || context.id) {
    await updateEvaluationReference({
      interviewId: interviewId || context.id,
      evaluationId: storedEvaluation.id,
    });
  }

  const evaluationDocument = {
    ...storedEvaluation,
    transcript: {
      text: transcriptText,
      meta: transcriptMeta || {},
    },
  };

  return evaluationDocument;
};

module.exports = {
  evaluateInterviewJob,
};
