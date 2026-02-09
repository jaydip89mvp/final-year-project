import mongoose from 'mongoose';

const generatedContentSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    index: true
  },
  neuroType: {
    type: String,
    required: [true, 'Neuro type is required'],
    enum: ['dyslexia', 'adhd', 'autism', 'general'],
    default: 'general',
    index: true
  },
  lessonContent: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  summary: {
    type: String,
    required: [true, 'Summary is required']
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true
      },
      options: {
        type: [String],
        required: true,
        validate: {
          validator: function(v) {
            return v.length === 4; // Each question must have exactly 4 options
          },
          message: 'Each question must have exactly 4 options'
        }
      },
      correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3,
        validate: {
          validator: function(v) {
            return v >= 0 && v < this.options.length;
          },
          message: 'Correct answer index must be within options array bounds'
        }
      }
    }
  ],
  imagePrompt: {
    type: String,
    required: [true, 'Image prompt is required']
  },
  audioPrompt: {
    type: String,
    required: [true, 'Audio prompt is required']
  },
  imageUrl: {
    type: String,
    default: null
  },
  audioUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index: no duplicate content for same topic + neuroType
generatedContentSchema.index({ topic: 1, neuroType: 1 }, { unique: true });
generatedContentSchema.index({ topic: 1 });
generatedContentSchema.index({ neuroType: 1 });

const GeneratedContent = mongoose.model('GeneratedContent', generatedContentSchema);

export default GeneratedContent;
