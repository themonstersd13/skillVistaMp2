const YEAR_PROFILES = {
  1: {
    label: 'FY',
    stage: 'First Year',
    strictness: 'supportive and foundational',
    focus: [
      'spoken communication clarity',
      'basic confidence and articulation',
      'fundamental problem understanding',
      'willingness to learn and improve',
    ],
    expectations: [
      'Do not expect advanced system design or production engineering depth.',
      'Reward clarity, confidence, and correct basics more than sophistication.',
      'Treat mistakes as learning gaps unless they show serious misunderstanding of basics.',
    ],
  },
  2: {
    label: 'SY',
    stage: 'Second Year',
    strictness: 'balanced but developmental',
    focus: [
      'data structures and algorithms reasoning',
      'core CS fundamentals',
      'ability to explain logic verbally',
      'technical accuracy in common interview topics',
    ],
    expectations: [
      'Expect stronger core CS understanding than a first-year student.',
      'Reward correct reasoning and structured explanations.',
      'Be moderately strict about technical mistakes in DSA and problem solving.',
    ],
  },
  3: {
    label: 'TY',
    stage: 'Third Year',
    strictness: 'interview-oriented and moderately strict',
    focus: [
      'project understanding and architecture thinking',
      'practical development trade-offs',
      'problem decomposition',
      'technical communication under interview conditions',
    ],
    expectations: [
      'Expect practical exposure to projects and implementation decisions.',
      'Be stricter about vague answers and shallow explanations.',
      'Look for evidence of ownership, debugging mindset, and design thinking.',
    ],
  },
  4: {
    label: 'LY',
    stage: 'Final Year',
    strictness: 'strict and placement-readiness focused',
    focus: [
      'placement readiness',
      'depth of technical reasoning',
      'system design maturity',
      'clarity, confidence, and actionability under pressure',
    ],
    expectations: [
      'Assess against strong entry-level placement expectations.',
      'Be strict about shallow, generic, or incorrect technical reasoning.',
      'Recommendation should clearly indicate readiness level and priority gaps.',
    ],
  },
};

const normalizeAcademicYear = (value) => {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
    return parsed;
  }

  return 1;
};

const buildEvaluationPrompt = ({
  transcriptText,
  academicYear,
  interviewTitle,
  interviewType,
}) => {
  const normalizedYear = normalizeAcademicYear(academicYear);
  const profile = YEAR_PROFILES[normalizedYear];

  const instructions = [
    'You are evaluating a SkillVista student mock interview.',
    `Student stage: ${profile.stage} (${profile.label}).`,
    `Evaluation strictness: ${profile.strictness}.`,
    `Interview title: ${interviewTitle || 'Interview Submission'}.`,
    `Interview type: ${interviewType || 'mock'}.`,
    '',
    'Primary focus areas:',
    ...profile.focus.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Expectation guidelines:',
    ...profile.expectations.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Return ONLY valid JSON.',
    'Do not wrap JSON in markdown fences.',
    'Do not add commentary outside the JSON object.',
    'The JSON object must have exactly these top-level keys:',
    'strengths, weaknesses, opportunities, threats, readinessScore, categoryFeedback, nextSteps, overallRecommendation.',
    '',
    'Output shape rules:',
    '1. strengths, weaknesses, opportunities, threats: arrays of concise strings.',
    '2. readinessScore: integer from 0 to 100.',
    '3. categoryFeedback: object with keys communication, technicalDepth, problemSolving, confidence, roleReadiness.',
    '4. Each categoryFeedback value must be an object with keys score and feedback.',
    '5. nextSteps: array of 3 to 5 short actionable steps.',
    '6. overallRecommendation: short paragraph string.',
    '',
    'Transcript to evaluate:',
    transcriptText,
  ];

  return {
    academicYear: normalizedYear,
    yearProfile: profile,
    prompt: instructions.join('\n'),
  };
};

module.exports = {
  YEAR_PROFILES,
  buildEvaluationPrompt,
};
