const mongoose = require('mongoose');
const { connectMongo } = require('../database/mongoClient');
const InterviewDocument = require('../models/interviewModel');
const EvaluationDocument = require('../models/evaluationModel');
const ErrorResponse = require('../utils/errorResponse');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { sanitizeMongoSafeValue } = require('./geminiService');

const normalizeAcademicYear = (value) => {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
    return parsed;
  }

  return 1;
};

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (Object.values(USER_ROLES).includes(normalized)) {
    return normalized;
  }

  return USER_ROLES.STUDENT;
};

const ensureConnected = async () => {
  await connectMongo();
};

const serializeDocument = (document) => {
  if (!document) {
    return null;
  }

  const plain = typeof document.toObject === 'function' ? document.toObject() : document;

  return {
    id: String(plain._id),
    ...plain,
    _id: undefined,
    __v: undefined,
  };
};

const storeTranscriptRawData = async ({
  interviewId,
  userId,
  role,
  currentYear,
  title,
  interviewType,
  transcriptText,
  transcriptMeta,
  rawSegments,
}) => {
  await ensureConnected();

  const document = await InterviewDocument.findOneAndUpdate(
    { interviewId: String(interviewId) },
    {
      interviewId: String(interviewId),
      userId: String(userId),
      role: normalizeRole(role),
      currentYear: normalizeAcademicYear(currentYear),
      title: title || 'Interview Submission',
      interviewType: interviewType || 'mock',
      status: 'completed',
      source: 'audio-worker',
      transcript: {
        text: String(transcriptText || '').trim(),
        rawSegments: Array.isArray(rawSegments) ? sanitizeMongoSafeValue(rawSegments) : [],
        meta: sanitizeMongoSafeValue(transcriptMeta || {}),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return serializeDocument(document);
};

const storeGeminiEvaluationResult = async ({
  interviewId,
  userId,
  role,
  currentYear,
  transcriptRefId,
  evaluation,
  geminiMeta,
}) => {
  await ensureConnected();

  const document = await EvaluationDocument.findOneAndUpdate(
    { interviewId: String(interviewId) },
    {
      interviewId: String(interviewId),
      userId: String(userId),
      role: normalizeRole(role),
      currentYear: normalizeAcademicYear(currentYear),
      transcriptRefId: transcriptRefId ? String(transcriptRefId) : null,
      result: sanitizeMongoSafeValue(evaluation || {}),
      geminiMeta: sanitizeMongoSafeValue(geminiMeta || {}),
      status: 'evaluated',
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return serializeDocument(document);
};

const getTranscriptByInterviewId = async (interviewId) => {
  await ensureConnected();
  const document = await InterviewDocument.findOne({ interviewId: String(interviewId) }).lean();
  return serializeDocument(document);
};

const getTranscriptByStudentId = async (studentId) => {
  await ensureConnected();
  const documents = await InterviewDocument.find({ userId: String(studentId) }).sort({ createdAt: -1 }).lean();
  return documents.map(serializeDocument);
};

const getEvaluationByInterviewId = async (interviewId) => {
  await ensureConnected();
  const document = await EvaluationDocument.findOne({ interviewId: String(interviewId) }).lean();
  return serializeDocument(document);
};

const getEvaluationsByStudentId = async (studentId) => {
  await ensureConnected();
  const documents = await EvaluationDocument.find({ userId: String(studentId) }).sort({ createdAt: -1 }).lean();
  return documents.map(serializeDocument);
};

const getEvaluationById = async (evaluationId) => {
  await ensureConnected();

  if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
    throw new ErrorResponse('Invalid evaluation id.', HTTP_STATUS.BAD_REQUEST);
  }

  const document = await EvaluationDocument.findById(evaluationId).lean();
  return serializeDocument(document);
};

module.exports = {
  storeTranscriptRawData,
  storeGeminiEvaluationResult,
  getTranscriptByInterviewId,
  getTranscriptByStudentId,
  getEvaluationByInterviewId,
  getEvaluationsByStudentId,
  getEvaluationById,
};
