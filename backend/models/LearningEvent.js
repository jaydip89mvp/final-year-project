import mongoose from 'mongoose';

const learningEventSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    },
    eventType: {
        type: String,
        enum: ['quiz_attempt', 'lesson_view', 'hint_request', 'mode_switch', 'early_exit'],
        required: [true, 'Event type is required']
    },
    score: {
        type: Number,
        default: null
    },
    totalQuestions: {
        type: Number,
        default: null
    },
    timeSpentSeconds: {
        type: Number,
        default: 0
    },
    hintsUsed: {
        type: Number,
        default: 0
    },
    contentMode: {
        type: String,
        enum: ['text', 'audio', 'visual', 'mixed'],
        default: 'text'
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster querying by student and event type
learningEventSchema.index({ studentId: 1, eventType: 1 });
learningEventSchema.index({ studentId: 1, topicId: 1 });
learningEventSchema.index({ timestamp: -1 });

const LearningEvent = mongoose.model('LearningEvent', learningEventSchema);

export default LearningEvent;
