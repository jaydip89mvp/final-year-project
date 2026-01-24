import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  topicTitle: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true
  },
  difficultyLevel: {
    type: String,
    required: [true, 'Difficulty level is required'],
    trim: true
  },
  normalContent: {
    type: String,
    required: [true, 'Normal content is required']
  },
  simplifiedContent: {
    type: String,
    required: [true, 'Simplified content is required']
  },
  multimediaLinks: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
