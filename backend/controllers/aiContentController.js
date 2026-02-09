import OpenAI from 'openai';
import GeneratedContent from '../models/GeneratedContent.js';
import StudentProfile from '../models/StudentProfile.js';
import { sanitizeTopic, validateTopic, validateVoice } from '../utils/validators.js';
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Single OpenAI model for all generations
const CHAT_MODEL = 'gpt-4-turbo';
const CHAT_MODEL_FALLBACK = 'gpt-3.5-turbo';

// @desc    Generate lesson content (neurodiverse-aware) for a student
// @route   POST /api/ai/generate/:studentId
// @access  Protected
export const generateLessonAndQuestionsByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.userId;
    const { topic } = req.body;

    // Authorization: student can generate for self; teacher/parent for any student
    if (studentId !== req.userId && req.userRole !== 'teacher' && req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate content for yourself or as teacher/parent for a student.'
      });
    }

    const validation = validateTopic(topic);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const topicName = sanitizeTopic(topic);

    // Fetch student profile to get neuroType
    let neuroType = 'general';
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile && profile.neuroType && VALID_NEURO_TYPES.includes(profile.neuroType)) {
      neuroType = profile.neuroType;
    }

    // No duplicate for same topic + neuroType
    const existingContent = await GeneratedContent.findOne({ topic: topicName, neuroType });
    if (existingContent) {
      return res.status(200).json({
        success: true,
        message: 'Content already exists for this topic and learner type',
        data: existingContent
      });
    }

    // Select lesson prompt by neuroType (single LLM, dynamic prompt)
    const lessonPromptConfig = getLessonPrompt(neuroType, topicName);

    const lessonResponse = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: lessonPromptConfig.system },
        { role: 'user', content: lessonPromptConfig.user }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const lessonContent = lessonResponse.choices[0]?.message?.content;
    if (!lessonContent || typeof lessonContent !== 'string') {
      return res.status(502).json({
        success: false,
        message: 'OpenAI did not return valid lesson content'
      });
    }

    const summaryResponse = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT_SYSTEM },
        { role: 'user', content: SUMMARY_PROMPT_USER(lessonContent) }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    const summary = summaryResponse.choices[0]?.message?.content || '';

    let questionResponse;
    let questions = [];
    try {
      questionResponse = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: QUESTION_PROMPT_SYSTEM },
          { role: 'user', content: QUESTION_PROMPT_USER(lessonContent) }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
    } catch (modelErr) {
      try {
        questionResponse = await openai.chat.completions.create({
          model: CHAT_MODEL_FALLBACK,
          messages: [
            { role: 'system', content: QUESTION_PROMPT_SYSTEM + ' Return ONLY the JSON object, no markdown.' },
            { role: 'user', content: QUESTION_PROMPT_USER(lessonContent) }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });
      } catch (fallbackErr) {
        throw new Error('Failed to generate questions from OpenAI');
      }
    }

    try {
      const rawContent = questionResponse.choices[0]?.message?.content;
      if (!rawContent || typeof rawContent !== 'string') throw new Error('No content');
      let responseContent = rawContent.trim();
      if (responseContent.startsWith('```json')) {
        responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (responseContent.startsWith('```')) {
        responseContent = responseContent.replace(/```\n?/g, '');
      }
      const questionData = JSON.parse(responseContent);
      questions = questionData.questions || [];
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid questions format');
      questions = questions.map(q => ({
        questionText: q.questionText || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0
      })).filter(q => q.questionText && q.options.length === 4);
      if (questions.length === 0) throw new Error('No valid questions');
    } catch (parseErr) {
      console.error('Error parsing questions JSON:', parseErr);
      questions = [{
        questionText: `What is the main concept of ${topicName}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      }];
    }

    const imagePromptResponse = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: IMAGE_PROMPT_SYSTEM },
        { role: 'user', content: IMAGE_PROMPT_USER(topicName) }
      ],
      temperature: 0.8,
      max_tokens: 300
    });
    const imagePrompt = imagePromptResponse.choices[0]?.message?.content || `Educational diagram explaining: ${topicName}`;

    const audioPromptResponse = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: AUDIO_PROMPT_SYSTEM },
        { role: 'user', content: AUDIO_PROMPT_USER(topicName) }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    const audioPrompt = audioPromptResponse.choices[0]?.message?.content || `Calm, clear narration about ${topicName}`;

    let imageUrl = null;
    try {
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });
      imageUrl = imageResponse.data[0].url;
    } catch (imageError) {
      console.error('Error generating image:', imageError);
    }

    let audioUrl = null;
    try {
      const audioNarrationText = `Educational narration about ${topicName}. ${summary}`;
      const audioResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: audioNarrationText.substring(0, 4096)
      });
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      audioUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
    }

    let generatedContent;
    try {
      generatedContent = await GeneratedContent.create({
        topic: topicName,
        neuroType,
        lessonContent,
        summary,
        questions,
        imagePrompt,
        audioPrompt,
        imageUrl,
        audioUrl
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        const existing = await GeneratedContent.findOne({ topic: topicName, neuroType }) ||
          await GeneratedContent.findOne({ topic: topicName });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Content already exists for this topic and learner type',
            data: existing
          });
        }
      }
      throw createErr;
    }

    res.status(201).json({
      success: true,
      message: 'Content generated and saved successfully',
      data: generatedContent
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'OpenAI API error',
        error: error.message
      });
    }
    next(error);
  }
};

// Legacy: generate with topic only (uses req.userId as studentId)
export const generateLessonAndQuestions = async (req, res, next) => {
  req.params.studentId = req.userId;
  return generateLessonAndQuestionsByStudent(req, res, next);
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
        ? { topic: topicName, $or: [ { neuroType: 'general' }, { neuroType: { $exists: false } } ] }
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

    // Generate image using DALL-E
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: generatedContent.imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const imageUrl = imageResponse.data[0].url;

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

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'OpenAI API error',
        error: error.message
      });
    }
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

    // Create audio narration text from summary and lesson content
    const audioNarrationText = `Educational narration about ${topicName}. ${generatedContent.summary}`;
    
    const textToSpeak = audioNarrationText.substring(0, 4096); // TTS has character limit

    // Generate audio using OpenAI TTS
    const audioResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voiceToUse,
      input: textToSpeak
    });

    // Convert audio buffer to base64 data URL
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    // Update the document with audio URL
    generatedContent.audioUrl = audioUrl;
    await generatedContent.save();

    res.status(200).json({
      success: true,
      message: 'Audio card generated successfully',
      data: {
        topic: generatedContent.topic,
        audioUrl: generatedContent.audioUrl,
        audioPrompt: generatedContent.audioPrompt,
        voice: voiceToUse
      }
    });

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'OpenAI API error',
        error: error.message
      });
    }
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

    // Generate visual card if not exists
    if (!generatedContent.imageUrl) {
      try {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: generatedContent.imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        });
        generatedContent.imageUrl = imageResponse.data[0].url;
        results.visualCard = {
          imageUrl: generatedContent.imageUrl,
          imagePrompt: generatedContent.imagePrompt
        };
      } catch (imageError) {
        console.error('Error generating visual card:', imageError);
        results.visualCard = { error: 'Failed to generate visual card' };
      }
    } else {
      results.visualCard = {
        imageUrl: generatedContent.imageUrl,
        imagePrompt: generatedContent.imagePrompt,
        message: 'Already exists'
      };
    }

    // Generate audio card if not exists
    if (!generatedContent.audioUrl) {
      try {
        const audioNarrationText = `Educational narration about ${topicName}. ${generatedContent.summary}`;
        const textToSpeak = audioNarrationText.substring(0, 4096);

        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: selectedVoice,
          input: textToSpeak
        });

        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const audioBase64 = audioBuffer.toString('base64');
        generatedContent.audioUrl = `data:audio/mp3;base64,${audioBase64}`;
        
        results.audioCard = {
          audioUrl: generatedContent.audioUrl,
          audioPrompt: generatedContent.audioPrompt,
          voice: selectedVoice
        };
      } catch (audioError) {
        console.error('Error generating audio card:', audioError);
        results.audioCard = { error: 'Failed to generate audio card' };
      }
    } else {
      results.audioCard = {
        audioUrl: generatedContent.audioUrl,
        audioPrompt: generatedContent.audioPrompt,
        message: 'Already exists'
      };
    }

    // Save updates
    await generatedContent.save();

    res.status(200).json({
      success: true,
      message: 'Cards generation completed',
      data: {
        topic: generatedContent.topic,
        ...results
      }
    });

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        success: false,
        message: 'OpenAI API error',
        error: error.message
      });
    }
    next(error);
  }
};
