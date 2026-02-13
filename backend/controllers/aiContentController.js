import GeneratedContent from '../models/GeneratedContent.js';
import StudentProfile from '../models/StudentProfile.js';
import { sanitizeTopic, validateTopic, validateVoice } from '../utils/validators.js';
import axios from 'axios';
import LearningEvent from '../models/LearningEvent.js';
import {
  getLessonPrompt,
  SUMMARY_PROMPT_SYSTEM,
  SUMMARY_PROMPT_USER,
  QUESTION_PROMPT_SYSTEM,
  QUESTION_PROMPT_USER,
  IMAGE_PROMPT_SYSTEM,
  IMAGE_PROMPT_USER,
  AUDIO_PROMPT_SYSTEM,
  AUDIO_PROMPT_USER,
  VALID_NEURO_TYPES
} from '../config/neuroPrompts.js';
import groqClient from '../config/groqClient.js';

// Groq model for text generation
const GROQ_MODEL = "llama-3.3-70b-versatile";


// Legacy ML microservice (still used for some flows)
const ML_SERVICE_URL = 'http://localhost:8000';

/**
 * Generate lesson + summary + questions on-the-fly via Groq (no DB dependency).
 * Neurodiverse-aware using prompts from neuroPrompts and StudentProfile.neuroType.
 * 
 * @route  POST /api/ai/live-lesson
 * @access Protected
 */
export const generateLiveLessonAndQuestions = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { topic } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const topicName = sanitizeTopic(topic);

    // Determine neuroType from profile (default: general)
    let neuroType = 'general';
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile && profile.neuroType && VALID_NEURO_TYPES.includes(profile.neuroType)) {
      neuroType = profile.neuroType;
    }

    // 1) Generate LESSON via Groq using neurodiverse prompt
    const { system, user: userPrompt } = getLessonPrompt(neuroType, topicName);
    const lessonResponse = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    const lessonContent = lessonResponse.data?.choices?.[0]?.message?.content?.trim() || '';

    if (!lessonContent) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return lesson content.'
      });
    }

    // 2) Generate SUMMARY using common summary prompt
    const summaryResponse = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT_SYSTEM },
        { role: 'user', content: SUMMARY_PROMPT_USER(lessonContent) }
      ],
      temperature: 0.4,
      max_tokens: 512
    });
    const summary = summaryResponse.data?.choices?.[0]?.message?.content?.trim() || '';

    // 3) Generate QUESTIONS as JSON using question prompts
    const questionsResponse = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: QUESTION_PROMPT_SYSTEM },
        { role: 'user', content: QUESTION_PROMPT_USER(lessonContent) }
      ],
      temperature: 0.4,
      max_tokens: 1024
    });
    const rawQuestions = questionsResponse.data?.choices?.[0]?.message?.content;

    let parsedQuestions = [];
    if (rawQuestions) {
      try {
        const cleaned = rawQuestions
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const json = JSON.parse(cleaned);
        if (Array.isArray(json.questions)) {
          parsedQuestions = json.questions.map((q, idx) => ({
            _id: `ai-q-${idx}`,
            questionText: q.questionText,
            options: q.options,
            // For compatibility with frontend/backend models
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            correctOptionIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
          }));
        }
      } catch (parseErr) {
        console.error('Failed to parse AI questions JSON:', parseErr);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        topic: topicName,
        neuroType,
        lessonContent,
        summary,
        questions: parsedQuestions
      }
    });
  } catch (error) {
    console.error('generateLiveLessonAndQuestions error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI lesson and questions.',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Generate subtopics for a given topic (5–8 logical subtopics).
 * Stores subtopic skeletons in Progress for this student+topic, and returns list.
 *
 * @route  POST /api/ai/generate-subtopics
 * @access Protected
 */
export const generateSubtopics = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { topic, topicId } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const topicName = sanitizeTopic(topic);

    const response = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert curriculum designer. Always respond with strict JSON.' },
        { role: 'user', content: `Break the topic "${topicName}" into as possible as many subtopics.\nReturn only JSON:\n{\n  "subtopics": ["sub1", "sub2"]\n}` }
      ],
      temperature: 0.4,
      max_tokens: 512
    });
    const raw = response.data?.choices?.[0]?.message?.content || '';
    let subtopics = [];
    if (raw) {
      try {
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const json = JSON.parse(cleaned);
        if (Array.isArray(json.subtopics)) {
          subtopics = json.subtopics.map(s => String(s)).filter(Boolean);
        }
      } catch (e) {
        console.error('Failed to parse subtopics JSON:', e);
      }
    }

    if (!subtopics.length) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return valid subtopics.'
      });
    }

    // Optionally store subtopics skeleton in Progress
    if (topicId) {
      const Progress = (await import('../models/Progress.js')).default;

      const doc = await Progress.findOne({ studentId, topicId });
      if (!doc) {
        await Progress.create({
          studentId,
          topicId,
          score: 0,
          status: 'weak',
          attempts: 0,
          timeSpentSeconds: 0,
          subtopics: subtopics.map(name => ({
            name,
            masteryScore: 0,
            correct: 0,
            total: 0
          }))
        });
      } else {
        // Merge: add new subtopics that are not present yet
        const existingNames = new Set((doc.subtopics || []).map(s => s.name));
        const toAdd = subtopics.filter(name => !existingNames.has(name)).map(name => ({
          name,
          masteryScore: 0,
          correct: 0,
          total: 0
        }));
        if (toAdd.length > 0) {
          doc.subtopics.push(...toAdd);
          await doc.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        topic: topicName,
        subtopics
      }
    });
  } catch (error) {
    console.error('generateSubtopics error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate subtopics.',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Generate learning material for a specific subtopic (no quiz).
 *
 * @route  POST /api/ai/subtopic-lesson
 * @access Protected
 */
export const generateSubtopicLesson = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { topic, subtopic } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    if (!subtopic || typeof subtopic !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Subtopic is required'
      });
    }

    const topicName = sanitizeTopic(topic);
    const subtopicName = subtopic.trim();

    // Determine neuroType from profile
    let neuroType = 'general';
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile && profile.neuroType && VALID_NEURO_TYPES.includes(profile.neuroType)) {
      neuroType = profile.neuroType;
    }

    const { system, user: baseUserPrompt } = getLessonPrompt(neuroType, topicName);
    const userPrompt = `${baseUserPrompt}

Focus ONLY on the subtopic: "${subtopicName}" within the broader topic "${topicName}".

Generate in-depth, comprehensive learning material ONLY (no questions, no quiz, no assessment). Include:
- Clear definitions and step-by-step explanations
- Multiple worked examples
- Key takeaways and summary points
- Real-world connections where helpful
Be thorough and detailed so the learner can master this subtopic.

IMPORTANT: Return ONLY the lesson content. Do not include comments, explanations outside the content, markdown code blocks, or any text that is not part of the lesson material itself.`;

    const lessonResponse = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    const lessonContent = lessonResponse.data?.choices?.[0]?.message?.content?.trim() || '';

    if (!lessonContent) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return lesson content for this subtopic.'
      });
    }

    // Log event (optional)
    await LearningEvent.create({
      studentId,
      topicId: null,
      eventType: 'subtopic_view',
      contentMode: 'text',
      details: {
        topic: topicName,
        subtopic: subtopicName
      },
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      data: {
        topic: topicName,
        subtopic: subtopicName,
        lessonContent
      }
    });
  } catch (error) {
    console.error('generateSubtopicLesson error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate subtopic lesson.',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Generate quiz questions based on a list of subtopics.
 *
 * @route  POST /api/ai/generate-quiz
 * @access Protected
 */
export const generateQuizForSubtopics = async (req, res, next) => {
  try {
    const { topic, subtopics } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    if (!Array.isArray(subtopics) || subtopics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subtopics array is required'
      });
    }

    const topicName = sanitizeTopic(topic);
    const subtopicList = subtopics.map(s => String(s)).filter(Boolean);

    const userPrompt = `Based on these subtopics for the topic "${topicName}":
${subtopicList.map(s => `- ${s}`).join('\n')}

Generate 10 multiple-choice questions covering ALL subtopics evenly.

Return ONLY valid JSON with no comments, explanations, markdown, or extra text:
{
  "questions": [
    {
      "subtopic": "Binary Tree",
      "questionText": "....",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0
    }
  ]
}`;

    const questionsResponse = await groqClient.post('/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: QUESTION_PROMPT_SYSTEM },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });
    const raw = questionsResponse.data?.choices?.[0]?.message?.content || '';

    let questions = [];
    if (raw) {
      try {
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const json = JSON.parse(cleaned);
        if (Array.isArray(json.questions)) {
          questions = json.questions.map((q, idx) => ({
            _id: `ai-subtopic-q-${idx}`,
            subtopic: q.subtopic,
            questionText: q.questionText,
            options: q.options || [],
            correctOptionIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
          }));
        }
      } catch (e) {
        console.error('Failed to parse subtopic quiz JSON:', e);
      }
    }

    if (!questions.length) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return valid quiz questions.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        topic: topicName,
        questions
      }
    });
  } catch (error) {
    console.error('generateQuizForSubtopics error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quiz for subtopics.',
      error: error.response?.data || error.message
    });
  }
};


// @desc    Generate lesson content (neurodiverse-aware) for a specific student (uses Groq live generator)
// @route   POST /api/ai/generate/:studentId
// @access  Protected
export const generateLessonAndQuestionsByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.userId;

    // Authorization: student can generate for self; teacher/parent for any student
    if (studentId !== req.userId && req.userRole !== 'teacher' && req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate content for yourself or as teacher/parent for a student.'
      });
    }

    // Temporarily impersonate the target student for neuroType lookup in generateLiveLessonAndQuestions
    const originalUserId = req.userId;
    req.userId = studentId;
    try {
      return await generateLiveLessonAndQuestions(req, res, next);
    } finally {
      req.userId = originalUserId;
    }
  } catch (error) {
    next(error);
  }
};

// Simple entrypoint: generate with topic only (uses req.userId + neuroPrompts via Groq)
export const generateLessonAndQuestions = async (req, res, next) => {
  // Delegate to live Groq-based generator so /api/ai/generate
  // always returns fresh AI lesson + summary + questions.
  return generateLiveLessonAndQuestions(req, res, next);
};

// @desc    Get generated content by topic (first match; backward compat)
// @route   GET /api/ai/content/:topic
// @access  Protected
export const getGeneratedContentByTopic = async (req, res, next) => {
  try {
    let rawTopic;
    try {
      rawTopic = decodeURIComponent(req.params.topic || '');
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid topic parameter' });
    }
    const validation = validateTopic(rawTopic);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const topicName = sanitizeTopic(rawTopic);
    const generatedContent = await GeneratedContent.findOne({ topic: topicName });
    if (!generatedContent) {
      return res.status(404).json({ success: false, message: 'Generated content not found for this topic' });
    }
    res.status(200).json({
      success: true,
      data: formatGeneratedContentResponse(generatedContent)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get generated content by topic and neuroType
// @route   GET /api/ai/content/:topic/:neuroType
// @access  Protected
export const getGeneratedContentByTopicAndNeuroType = async (req, res, next) => {
  try {
    let rawTopic;
    try {
      rawTopic = decodeURIComponent(req.params.topic || '');
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid topic parameter' });
    }
    const neuroTypeParam = (req.params.neuroType || 'general').toLowerCase();
    const neuroType = VALID_NEURO_TYPES.includes(neuroTypeParam) ? neuroTypeParam : 'general';

    const validation = validateTopic(rawTopic);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const topicName = sanitizeTopic(rawTopic);

    // For 'general', also match docs that don't have neuroType set (backward compat)
    let generatedContent = await GeneratedContent.findOne(
      neuroType === 'general'
        ? { topic: topicName, $or: [{ neuroType: 'general' }, { neuroType: { $exists: false } }] }
        : { topic: topicName, neuroType }
    );
    if (!generatedContent) {
      return res.status(404).json({
        success: false,
        message: `Generated content not found for topic "${topicName}" and learner type "${neuroType}"`
      });
    }

    res.status(200).json({
      success: true,
      data: formatGeneratedContentResponse(generatedContent)
    });
  } catch (error) {
    next(error);
  }
};

function formatGeneratedContentResponse(doc) {
  return {
    topic: doc.topic,
    neuroType: doc.neuroType || 'general',
    lessonContent: doc.lessonContent,
    summary: doc.summary,
    questions: doc.questions,
    imagePrompt: doc.imagePrompt,
    audioPrompt: doc.audioPrompt,
    imageUrl: doc.imageUrl || null,
    audioUrl: doc.audioUrl || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// @desc    Generate visual card (image) for a topic
// @route   POST /api/ai/generate-visual-card
// @access  Protected
export const generateVisualCard = async (req, res, next) => {
  try {
    const { topic, neuroType: bodyNeuroType } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const topicName = sanitizeTopic(topic);
    const neuroType = bodyNeuroType && VALID_NEURO_TYPES.includes(bodyNeuroType) ? bodyNeuroType : 'general';

    let generatedContent = await GeneratedContent.findOne({ topic: topicName, neuroType });
    if (!generatedContent && neuroType === 'general') {
      generatedContent = await GeneratedContent.findOne({ topic: topicName });
    }
    if (!generatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found for this topic. Please generate lesson content first.'
      });
    }

    // If image already exists, return it
    if (generatedContent.imageUrl) {
      return res.status(200).json({
        success: true,
        message: 'Visual card already exists',
        data: {
          topic: generatedContent.topic,
          imageUrl: generatedContent.imageUrl,
          imagePrompt: generatedContent.imagePrompt
        }
      });
    }

    // Generate image using Python Service
    try {
      const imageResponse = await axios.post(`${ML_SERVICE_URL}/generate/image`, {
        prompt: generatedContent.imagePrompt
      });

      const imageUrl = imageResponse.data.image_url;

      // Update the document with image URL
      generatedContent.imageUrl = imageUrl;
      await generatedContent.save();

      res.status(200).json({
        success: true,
        message: 'Visual card generated successfully',
        data: {
          topic: generatedContent.topic,
          imageUrl: generatedContent.imageUrl,
          imagePrompt: generatedContent.imagePrompt
        }
      });
    } catch (apiError) {
      console.error("Python Service Image Generation Failed:", apiError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to generate image via AI service"
      });
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Generate audio card for a topic
// @route   POST /api/ai/generate-audio-card
// @access  Protected
export const generateAudioCard = async (req, res, next) => {
  try {
    const { topic, voice, neuroType: bodyNeuroType } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const topicName = sanitizeTopic(topic);
    const voiceToUse = validateVoice(voice);
    const neuroType = bodyNeuroType && VALID_NEURO_TYPES.includes(bodyNeuroType) ? bodyNeuroType : 'general';

    let generatedContent = await GeneratedContent.findOne({ topic: topicName, neuroType });
    if (!generatedContent && neuroType === 'general') {
      generatedContent = await GeneratedContent.findOne({ topic: topicName });
    }
    if (!generatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found for this topic. Please generate lesson content first.'
      });
    }

    // If audio already exists, return it
    if (generatedContent.audioUrl) {
      return res.status(200).json({
        success: true,
        message: 'Audio card already exists',
        data: {
          topic: generatedContent.topic,
          audioUrl: generatedContent.audioUrl,
          audioPrompt: generatedContent.audioPrompt
        }
      });
    }

    // Audio generation not available (Groq-only backend; no TTS)
    return res.status(501).json({
      success: false,
      message: 'Audio generation is not available. This backend uses Groq only (no TTS).'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Generate both visual and audio cards for a topic
// @route   POST /api/ai/generate-cards
// @access  Protected
export const generateCards = async (req, res, next) => {
  try {
    const { topic, voice, neuroType: bodyNeuroType } = req.body;

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const topicName = sanitizeTopic(topic);
    const selectedVoice = validateVoice(voice);
    const neuroType = bodyNeuroType && VALID_NEURO_TYPES.includes(bodyNeuroType) ? bodyNeuroType : 'general';

    let generatedContent = await GeneratedContent.findOne({ topic: topicName, neuroType });
    if (!generatedContent && neuroType === 'general') {
      generatedContent = await GeneratedContent.findOne({ topic: topicName });
    }
    if (!generatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found for this topic. Please generate lesson content first.'
      });
    }

    const results = {
      visualCard: null,
      audioCard: null
    };

    // Image and audio generation not available (Groq-only backend)
    return res.status(501).json({
      success: false,
      message: 'Visual and audio card generation is not available. This backend uses Groq only (no image/TTS APIs).'
    });

  } catch (error) {
    next(error);
  }
};
