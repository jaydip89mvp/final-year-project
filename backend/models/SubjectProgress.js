import mongoose from 'mongoose';

const subjectProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  subtopics: [
    {
      name: { type: String, required: true },
      masteryScore: { type: Number, default: 0, min: 0, max: 1 },
      correct: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
      lastAttempt: { type: Date, default: null }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

subjectProgressSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

const SubjectProgress = mongoose.model('SubjectProgress', subjectProgressSchema);
export default SubjectProgress;
