import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Classroom name is required'],
        trim: true,
    },
    subject: {
        type: String, // e.g., "Math", "Science" - could link to Subject model optionally
        required: [true, 'Subject is required'],
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Teacher ID is required']
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    joinCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Classroom = mongoose.model('Classroom', classroomSchema);

export default Classroom;
