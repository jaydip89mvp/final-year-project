import mongoose from 'mongoose';

const generatedContentSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    unique: true,
    trim: true,
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
  }
}, {
  timestamps: true
});

// Index for faster topic lookups
generatedContentSchema.index({ topic: 1 });

const GeneratedContent = mongoose.model('GeneratedContent', generatedContentSchema);

export default GeneratedContent;
