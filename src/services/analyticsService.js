const { query } = require('../database/pgClient');
const {
  getEvaluationsByStudentId,
  getEvaluationById,
  getTranscriptByInterviewId,
} = require('./mongoStorageService');
const { USER_ROLES, HTTP_STATUS } = require('../config/constants');
const ErrorResponse = require('../utils/errorResponse');

const assertStudentAccess = async ({ requester, studentId }) => {
  if (requester.role === USER_ROLES.ADMIN) {
    return;
  }

  if (requester.role === USER_ROLES.STUDENT) {
    if (String(requester.id || requester.sub) !== String(studentId)) {
      throw new ErrorResponse('You can only access your own analytics.', HTTP_STATUS.FORBIDDEN);
    }

    return;
  }

  if (requester.role === USER_ROLES.FACULTY) {
    const result = await query(
      `
        SELECT 1
        FROM faculty_student_map
        WHERE faculty_user_id = $1 AND student_user_id = $2
        LIMIT 1
      `,
      [requester.id || requester.sub, studentId]
    );

    if (result.rowCount === 0) {
      throw new ErrorResponse('You do not have access to this student analytics.', HTTP_STATUS.FORBIDDEN);
    }
  }
};

const getUserBaseProfile = async (userId) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.department,
        u.academic_year,
        r.role_key
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new ErrorResponse('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const row = result.rows[0];

  return {
    id: row.id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    department: row.department,
    currentYear: row.academic_year,
    role: row.role_key,
  };
};

const getInterviewRowsByStudent = async (studentId) => {
  const result = await query(
    `
      SELECT
        i.id,
        i.title,
        i.interview_type,
        i.academic_year,
        i.created_at,
        i.completed_at,
        i.overall_score,
        es.status,
        es.queue_job_id,
        es.evaluation_mongo_id,
        es.error_message
      FROM interviews i
      LEFT JOIN evaluation_status es ON es.interview_id = i.id
      WHERE i.user_id = $1
      ORDER BY i.created_at DESC
    `,
    [studentId]
  );

  return result.rows;
};

const summarizeReadiness = (evaluations) => {
  if (!evaluations.length) {
    return {
      average: 0,
      latest: null,
      distribution: {
        beginner: 0,
        developing: 0,
        readySoon: 0,
        placementReady: 0,
      },
    };
  }

  const scores = evaluations.map((item) => Number(item.result && item.result.readinessScore) || 0);
  const average = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const latest = evaluations[0].result ? evaluations[0].result.readinessScore : null;

  const distribution = scores.reduce(
    (accumulator, score) => {
      if (score < 40) {
        accumulator.beginner += 1;
      } else if (score < 60) {
        accumulator.developing += 1;
      } else if (score < 80) {
        accumulator.readySoon += 1;
      } else {
        accumulator.placementReady += 1;
      }

      return accumulator;
    },
    {
      beginner: 0,
      developing: 0,
      readySoon: 0,
      placementReady: 0,
    }
  );

  return {
    average,
    latest,
    distribution,
  };
};

const buildHistoryItems = (interviews, evaluationsByInterviewId) => {
  return interviews.map((interview) => {
    const evaluation = evaluationsByInterviewId.get(String(interview.id));
    const result = evaluation && evaluation.result ? evaluation.result : {};

    return {
      interviewId: interview.id,
      evaluationId: evaluation ? evaluation.id : null,
      title: interview.title,
      interviewType: interview.interview_type,
      currentYear: interview.academic_year,
      queueStatus: interview.status,
      readinessScore: result.readinessScore || 0,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      nextSteps: result.nextSteps || [],
      recommendation: result.overallRecommendation || '',
      createdAt: interview.created_at,
      completedAt: interview.completed_at,
    };
  });
};

const getStudentPersonalAnalytics = async ({ requester, studentId }) => {
  const targetStudentId = studentId || requester.id || requester.sub;
  await assertStudentAccess({ requester, studentId: targetStudentId });

  const profile = await getUserBaseProfile(targetStudentId);
  const interviews = await getInterviewRowsByStudent(targetStudentId);
  const evaluations = await getEvaluationsByStudentId(targetStudentId);
  const evaluationsByInterviewId = new Map(
    evaluations.map((item) => [String(item.interviewId), item])
  );

  const readiness = summarizeReadiness(evaluations);
  const history = buildHistoryItems(interviews, evaluationsByInterviewId);

  return {
    student: profile,
    summary: {
      totalInterviews: interviews.length,
      completedEvaluations: history.filter((item) => item.queueStatus === 'completed').length,
      averageReadinessScore: readiness.average,
      latestReadinessScore: readiness.latest,
      readinessDistribution: readiness.distribution,
    },
    history,
  };
};

const getFacultyCohortAnalytics = async ({ requester }) => {
  const requesterId = requester.id || requester.sub;

  const studentQuery =
    requester.role === USER_ROLES.ADMIN
      ? `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.department,
          u.academic_year
        FROM users u
        INNER JOIN roles r ON r.id = u.role_id
        WHERE r.role_key = $1
        ORDER BY u.academic_year ASC, u.first_name ASC, u.last_name ASC
      `
      : `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.department,
          u.academic_year
        FROM faculty_student_map fsm
        INNER JOIN users u ON u.id = fsm.student_user_id
        WHERE fsm.faculty_user_id = $1
        ORDER BY u.academic_year ASC, u.first_name ASC, u.last_name ASC
      `;

  const studentResult = await query(
    studentQuery,
    requester.role === USER_ROLES.ADMIN ? [USER_ROLES.STUDENT] : [requesterId]
  );

  const students = studentResult.rows;

  const studentCards = await Promise.all(
    students.map(async (student) => {
      const personalAnalytics = await getStudentPersonalAnalytics({
        requester,
        studentId: student.id,
      });

      return {
        studentId: student.id,
        fullName: `${student.first_name} ${student.last_name}`.trim(),
        email: student.email,
        department: student.department,
        currentYear: student.academic_year,
        totalInterviews: personalAnalytics.summary.totalInterviews,
        completedEvaluations: personalAnalytics.summary.completedEvaluations,
        averageReadinessScore: personalAnalytics.summary.averageReadinessScore,
        latestReadinessScore: personalAnalytics.summary.latestReadinessScore,
        latestRecommendation:
          personalAnalytics.history[0] && personalAnalytics.history[0].recommendation
            ? personalAnalytics.history[0].recommendation
            : '',
      };
    })
  );

  const totalStudents = studentCards.length;
  const totalInterviews = studentCards.reduce((sum, item) => sum + item.totalInterviews, 0);
  const completedEvaluations = studentCards.reduce(
    (sum, item) => sum + item.completedEvaluations,
    0
  );
  const averageReadinessScore =
    totalStudents > 0
      ? Math.round(
          studentCards.reduce((sum, item) => sum + item.averageReadinessScore, 0) / totalStudents
        )
      : 0;

  return {
    cohort: {
      totalStudents,
      totalInterviews,
      completedEvaluations,
      averageReadinessScore,
    },
    students: studentCards,
  };
};

const getEvaluationHistory = async ({ requester, studentId }) => {
  const analytics = await getStudentPersonalAnalytics({ requester, studentId });
  return {
    student: analytics.student,
    history: analytics.history,
  };
};

const getSingleEvaluation = async ({ requester, evaluationId }) => {
  const evaluation = await getEvaluationById(evaluationId);

  if (!evaluation) {
    throw new ErrorResponse('Evaluation not found.', HTTP_STATUS.NOT_FOUND);
  }

  await assertStudentAccess({
    requester,
    studentId: evaluation.userId,
  });

  const transcript =
    evaluation.interviewId ? await getTranscriptByInterviewId(evaluation.interviewId).catch(() => null) : null;

  return {
    evaluationId: evaluation.id,
    interviewId: evaluation.interviewId,
    userId: evaluation.userId,
    role: evaluation.role,
    currentYear: evaluation.currentYear,
    result: evaluation.result || {},
    geminiMeta: evaluation.geminiMeta || {},
    transcript: transcript
      ? {
          id: transcript.id,
          text: transcript.transcript ? transcript.transcript.text : '',
          meta: transcript.transcript ? transcript.transcript.meta : {},
        }
      : null,
    createdAt: evaluation.createdAt,
    updatedAt: evaluation.updatedAt,
  };
};

module.exports = {
  getFacultyCohortAnalytics,
  getStudentPersonalAnalytics,
  getEvaluationHistory,
  getSingleEvaluation,
};
