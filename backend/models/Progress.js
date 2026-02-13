import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  status: {
    type: String,
    enum: ['mastered', 'developing', 'weak'],
    required: [true, 'Status is required']
  },
  attempts: {
    type: Number,
    default: 0,
    min: [0, 'Attempts cannot be negative']
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  // Optional: subtopic-level mastery for adaptive engine
  subtopics: [
    {
      name: {
        type: String,
        required: true
      },
      masteryScore: {
        type: Number,
        default: 0,
        min: [0, 'Mastery score cannot be negative'],
        max: [1, 'Mastery score cannot exceed 1']
      },
      correct: {
        type: Number,
        default: 0,
        min: [0, 'Correct count cannot be negative']
      },
      total: {
        type: Number,
        default: 0,
        min: [0, 'Total count cannot be negative']
      },
      lastAttempt: {
        type: Date,
        default: null
      }
    }
  ],
  lastAttemptDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
progressSchema.index({ studentId: 1, topicId: 1 }, { unique: true });
progressSchema.index({ studentId: 1 });
progressSchema.index({ topicId: 1 });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
