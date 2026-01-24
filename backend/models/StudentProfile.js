import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  ageGroup: {
    type: String,
    required: [true, 'Age group is required'],
    trim: true
  },
  educationLevel: {
    type: String,
    required: [true, 'Education level is required'],
    trim: true
  },
  learningComfort: {
    type: String,
    required: [true, 'Learning comfort level is required'],
    trim: true
  },
  neuroType: {
    type: String,
    enum: ['dyslexia', 'adhd', 'autism', 'general'],
    required: [true, 'Neuro type is required'],
    default: 'general'
  },
  supportLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Support level is required'],
    default: 'medium'
  }
}, {
  timestamps: true
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;
