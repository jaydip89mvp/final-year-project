import mongoose from 'mongoose';

const parentLinkSchema = new mongoose.Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Parent ID is required']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    status: {
        type: String,
        enum: ['pending', 'linked'],
        default: 'linked' // For now, we'll auto-link if the parent knows the student's email/code
    }
}, {
    timestamps: true
});

// Avoid duplicate links
parentLinkSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

const ParentLink = mongoose.model('ParentLink', parentLinkSchema);

export default ParentLink;
