import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const classroomPostSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['notice', 'material'],
        default: 'notice'
    },
    comments: [commentSchema]
}, {
    timestamps: true
});

const ClassroomPost = mongoose.model('ClassroomPost', classroomPostSchema);

export default ClassroomPost;
