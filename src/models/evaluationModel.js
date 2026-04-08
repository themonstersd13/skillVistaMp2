const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    currentYear: {
      type: Number,
      min: 1,
      max: 4,
      required: true,
      index: true,
    },
    transcriptRefId: {
      type: String,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    geminiMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      default: 'evaluated',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ interviewId: 1, createdAt: -1 });
evaluationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
