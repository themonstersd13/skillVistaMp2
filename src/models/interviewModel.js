const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
      index: true,
      unique: true,
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
    title: {
      type: String,
      trim: true,
    },
    interviewType: {
      type: String,
      trim: true,
      default: 'mock',
    },
    transcript: {
      text: {
        type: String,
        default: '',
      },
      rawSegments: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    status: {
      type: String,
      default: 'completed',
      index: true,
    },
    source: {
      type: String,
      default: 'audio-worker',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ interviewId: 1, userId: 1 });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
