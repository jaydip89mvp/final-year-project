import OpenAI from 'openai';
import GeneratedContent from '../models/GeneratedContent.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// @desc    Generate lesson content and questions using OpenAI
// @route   POST /api/ai/generate
// @access  Protected
export const generateLessonAndQuestions = async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Topic is required and must be a non-empty string'
      });
    }

    const topicName = topic.trim();

    // Check if content already exists for this topic
    const existingContent = await GeneratedContent.findOne({ topic: topicName });
    if (existingContent) {
      return res.status(200).json({
        success: true,
        message: 'Content already exists for this topic',
        data: existingContent
      });
    }

    // Generate lesson content
    const lessonPrompt = `Generate a detailed, structured lesson on the topic: ${topicName}.
Explain concepts step-by-step in simple language.
Include examples and learning points.
Make it comprehensive and educational, suitable for adaptive learning.`;

    const lessonResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Generate clear, structured, and comprehensive lesson content.'
        },
        {
          role: 'user',
          content: lessonPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const lessonContent = lessonResponse.choices[0].message.content;

    // Generate summary
    const summaryPrompt = `Summarize the following lesson content into short, clear bullet points. Keep it concise and easy to understand.

Lesson Content:
${lessonContent}`;

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating concise summaries. Create clear, bullet-point summaries.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    const summary = summaryResponse.choices[0].message.content;

    // Generate questions
    const questionPrompt = `Generate 5-10 multiple-choice questions based on the following lesson content.
Each question should have exactly 4 options and one correct answer.
Return the result in valid JSON format with this exact structure:
{
  "questions": [
    {
      "questionText": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}
Where correctAnswer is the index (0-3) of the correct option.

Lesson Content:
${lessonContent}`;

    // Try with JSON mode first (for compatible models)
    let questionResponse;
    let questions = [];
    
    try {
      questionResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating educational multiple-choice questions. Always return valid JSON format only, no additional text.'
          },
          {
            role: 'user',
            content: questionPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
    } catch (modelError) {
      // Fallback to gpt-3.5-turbo if gpt-4-turbo-preview is not available
      try {
        questionResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at creating educational multiple-choice questions. Always return valid JSON format only, no additional text. Return ONLY the JSON object, no markdown, no code blocks.'
            },
            {
              role: 'user',
              content: questionPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });
      } catch (fallbackError) {
        throw new Error('Failed to generate questions from OpenAI');
      }
    }

    try {
      let responseContent = questionResponse.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      if (responseContent.startsWith('```json')) {
        responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (responseContent.startsWith('```')) {
        responseContent = responseContent.replace(/```\n?/g, '');
      }
      
      const questionData = JSON.parse(responseContent);
      questions = questionData.questions || [];
      
      // Validate questions structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }

      // Ensure each question has correct structure
      questions = questions.map(q => ({
        questionText: q.questionText || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 
          ? q.correctAnswer 
          : 0
      })).filter(q => q.questionText && q.options.length === 4);

      if (questions.length === 0) {
        throw new Error('No valid questions generated');
      }
    } catch (parseError) {
      console.error('Error parsing questions JSON:', parseError);
      // Fallback: create a simple question structure
      questions = [{
        questionText: `What is the main concept of ${topicName}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      }];
    }

    // Generate image prompt
    const imagePromptText = `Create a detailed image generation prompt that visually explains the topic: ${topicName}.
The prompt should be suitable for AI image generation tools like DALL-E or Midjourney.
Make it descriptive and educational.`;

    const imagePromptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating detailed image generation prompts for educational content.'
        },
        {
          role: 'user',
          content: imagePromptText
        }
      ],
      temperature: 0.8,
      max_tokens: 300
    });

    const imagePrompt = imagePromptResponse.choices[0].message.content;

    // Generate audio prompt
    const audioPromptText = `Create a text prompt for generating an educational audio narration for the topic: ${topicName}.
The prompt should describe how the audio should sound, what tone to use, and what key points to cover.
Make it suitable for text-to-speech or voice narration systems.`;

    const audioPromptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational audio narration prompts.'
        },
        {
          role: 'user',
          content: audioPromptText
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const audioPrompt = audioPromptResponse.choices[0].message.content;

    // Save all generated content to MongoDB
    const generatedContent = await GeneratedContent.create({
      topic: topicName,
      lessonContent,
      summary,
      questions,
      imagePrompt,
      audioPrompt
    });

    res.status(201).json({
      success: true,
      message: 'Content generated and saved successfully',
      data: generatedContent
    });

  } catch (error) {
    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'OpenAI API error',
        error: error.message
      });
    }

    // Handle other errors
    next(error);
  }
};

// @desc    Get generated content by topic
// @route   GET /api/ai/content/:topic
// @access  Protected
export const getGeneratedContentByTopic = async (req, res, next) => {
  try {
    const { topic } = req.params;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Topic parameter is required'
      });
    }

    const topicName = topic.trim();

    const generatedContent = await GeneratedContent.findOne({ topic: topicName });

    if (!generatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Generated content not found for this topic'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        topic: generatedContent.topic,
        lessonContent: generatedContent.lessonContent,
        summary: generatedContent.summary,
        questions: generatedContent.questions,
        imagePrompt: generatedContent.imagePrompt,
        audioPrompt: generatedContent.audioPrompt,
        createdAt: generatedContent.createdAt,
        updatedAt: generatedContent.updatedAt
      }
    });

  } catch (error) {
    next(error);
  }
};
