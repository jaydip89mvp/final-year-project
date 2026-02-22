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
        enum: ['quiz_attempt', 'lesson_view', 'hint_request', 'mode_switch', 'early_exit', 'subtopic_view'],
        required: [true, 'Event type is required']
    },
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    correct: {
        type: Number,
        default: 0
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
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
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
}
);

// Comprehensive unique indexes for upserting
// 1. For top-level topics
learningEventSchema.index(
    { studentId: 1, subjectId: 1, topicId: 1, eventType: 1 },
    { unique: true, partialFilterExpression: { topicId: { $exists: true, $ne: null } } }
);

// 2. For roadmap nodes (using nodeName as identifier)
learningEventSchema.index(
    { studentId: 1, subjectId: 1, "details.nodeName": 1, eventType: 1 },
    { unique: true, partialFilterExpression: { "details.nodeName": { $exists: true, $ne: null } } }
);

// 3. For subtopics within a topic (AI generated)
learningEventSchema.index(
    { studentId: 1, subjectId: 1, "details.subtopic": 1, eventType: 1 },
    { unique: true, partialFilterExpression: { "details.subtopic": { $exists: true, $ne: null } } }
);

learningEventSchema.index({ timestamp: -1 });

const LearningEvent = mongoose.model('LearningEvent', learningEventSchema);

export default LearningEvent;
