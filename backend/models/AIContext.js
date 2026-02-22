import mongoose from 'mongoose';

const aiContextSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    topicName: {
        type: String,
        required: true
    },
    subtopicName: {
        type: String
    },
    keywords: [{
        type: String
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for fast lookup of latest context
aiContextSchema.index({ studentId: 1, topicName: 1, timestamp: -1 });

const AIContext = mongoose.model('AIContext', aiContextSchema);

export default AIContext;
