const env = require('../config/env');
const ErrorResponse = require('../utils/errorResponse');
const { HTTP_STATUS } = require('../config/constants');

const GEMINI_MODEL = 'gemini-1.5-flash';

const stripCodeFences = (value) => {
  return String(value || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
};

const sanitizeMongoSafeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeMongoSafeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      const safeKey = String(key).replace(/\./g, '_').replace(/^\$/g, '_');
      accumulator[safeKey] = sanitizeMongoSafeValue(nestedValue);
      return accumulator;
    }, {});
  }

  return value;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10);
};

const normalizeScore = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeCategoryFeedback = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const categories = ['communication', 'technicalDepth', 'problemSolving', 'confidence', 'roleReadiness'];

  return categories.reduce((accumulator, category) => {
    const categoryValue = source[category] && typeof source[category] === 'object' ? source[category] : {};

    accumulator[category] = {
      score: normalizeScore(categoryValue.score),
      feedback: String(categoryValue.feedback || '').trim(),
    };

    return accumulator;
  }, {});
};

const normalizeEvaluationResult = (value) => {
  const source = value && typeof value === 'object' ? value : {};

  const normalized = {
    strengths: normalizeStringArray(source.strengths),
    weaknesses: normalizeStringArray(source.weaknesses),
    opportunities: normalizeStringArray(source.opportunities),
    threats: normalizeStringArray(source.threats),
    readinessScore: normalizeScore(source.readinessScore),
    categoryFeedback: normalizeCategoryFeedback(source.categoryFeedback),
    nextSteps: normalizeStringArray(source.nextSteps).slice(0, 5),
    overallRecommendation: String(source.overallRecommendation || '').trim(),
  };

  return sanitizeMongoSafeValue(normalized);
};

const parseGeminiJson = (responseText) => {
  const cleaned = stripCodeFences(responseText);

  try {
    return normalizeEvaluationResult(JSON.parse(cleaned));
  } catch (error) {
    throw new ErrorResponse('Gemini returned an invalid JSON payload.', HTTP_STATUS.BAD_GATEWAY, [
      cleaned,
    ]);
  }
};

const evaluateWithGemini = async ({ prompt }) => {
  if (!env.geminiApiKey) {
    throw new ErrorResponse('Gemini API key is not configured.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ErrorResponse(
      'Gemini API request failed.',
      response.status || HTTP_STATUS.BAD_GATEWAY,
      payload
    );
  }

  const responseText =
    payload &&
    payload.candidates &&
    payload.candidates[0] &&
    payload.candidates[0].content &&
    payload.candidates[0].content.parts &&
    payload.candidates[0].content.parts[0] &&
    payload.candidates[0].content.parts[0].text;

  if (!responseText) {
    throw new ErrorResponse('Gemini API returned an empty response.', HTTP_STATUS.BAD_GATEWAY, payload);
  }

  return {
    model: GEMINI_MODEL,
    rawText: responseText,
    evaluation: parseGeminiJson(responseText),
  };
};

module.exports = {
  evaluateWithGemini,
  normalizeEvaluationResult,
  sanitizeMongoSafeValue,
};
