import mongoose from 'mongoose';

const STATUS = ['not_started', 'weak', 'mastered'];

const roadmapProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nodeKey: {
    type: String,
    required: true,
    index: true
  },
  childrenProgress: [
    {
      name: { type: String, required: true, trim: true },
      status: {
        type: String,
        enum: STATUS,
        default: 'not_started'
      },
      masteryScore: { type: Number, default: 0, min: 0, max: 1 },
      correct: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
      lastAttempt: { type: Date, default: null }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: false });

roadmapProgressSchema.index({ studentId: 1, nodeKey: 1 }, { unique: true });

const RoadmapProgress = mongoose.model('RoadmapProgress', roadmapProgressSchema);
export default RoadmapProgress;
