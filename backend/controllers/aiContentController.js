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

// Groq model for text generation (configurable via .env)
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";


// Legacy ML microservice (still used for some flows)
const ML_SERVICE_URL = 'http://localhost:8000';

// Image generation API - Removed in favor of frontend Puter.js
// const IMAGE_API_BASE = process.env.IMAGE_API_BASE_URL || '';
// const IMAGE_API_TOKEN = process.env.IMAGE_API_TOKEN || '';

// Murf.ai speech (POST /v1/speech/stream)
const MURF_API_KEY = process.env.MURF_API_KEY || '';
const MURF_STREAM_URL = 'https://api.murf.ai/v1/speech/stream';

async function generateSpeechFromMurf(text, voiceId = 'Matthew') {
  if (!MURF_API_KEY) throw new Error('Murf API not configured');
  const res = await axios.post(
    MURF_STREAM_URL,
    {
      text: String(text).substring(0, 5000),
      voiceId: voiceId || 'Matthew',
      model: 'FALCON',
      multiNativeLocale: 'en-US'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': MURF_API_KEY
      },
      responseType: 'arraybuffer',
      timeout: 60000
    }
  );
  const buffer = Buffer.from(res.data);
  const base64 = buffer.toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

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



function fixBrokenJson(text) {
  if (!text) return null;

  // 1. Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) { }

  // 2. Extract from first { to last } or [ to last ]
  let start = text.indexOf('{');
  let end = text.lastIndexOf('}');

  // If no braces at all, try to find an array
  if (start === -1) {
    start = text.indexOf('[');
    end = text.lastIndexOf(']');
  }

  if (start === -1) return null; // No JSON object or array found

  // If end is -1, it means the JSON is truncated at the end, so take till the end of the string
  let jsonString = text.substring(start, (end === -1 ? text.length : end + 1));

  // Helper functions for balancing and parsing
  const balanceBraces = (str) => {
    let openBraces = (str.match(/{/g) || []).length;
    let closeBraces = (str.match(/}/g) || []).length;
    let openBrackets = (str.match(/\[/g) || []).length;
    let closeBrackets = (str.match(/]/g) || []).length;

    let fixed = str;
    // Close open arrays first
    while (openBrackets > closeBrackets) {
      fixed += ']';
      closeBrackets++;
    }
    // Then close open objects
    while (openBraces > closeBraces) {
      fixed += '}';
      closeBraces++;
    }
    return fixed;
  };

  const tryParse = (str) => {
    try { return JSON.parse(str); } catch (e) { return null; }
  };

  // 3. Try balancing after initial substring
  let fixedAttempt = balanceBraces(jsonString.trim());
  let parsed = tryParse(fixedAttempt);
  if (parsed) return parsed;

  // 4. Fix common LLM JSON issues (trailing commas, newlines)
  jsonString = jsonString
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas before } or ]

  // 5. Escape unescaped newlines inside strings
  jsonString = jsonString.replace(
    /"([^"\\]*(?:\\.[^"\\]*)*)"/gs,
    (match) => match.replace(/\n/g, '\\n')
  );

  // 6. Try balancing again after common fixes
  fixedAttempt = balanceBraces(jsonString);
  parsed = tryParse(fixedAttempt);
  if (parsed) return parsed;

  console.error("Advanced JSON repair failed.");
  return null;
}



export const generateSubtopicLesson = async (req, res, next) => {
  console.log("🔥 SUBTOPIC LESSON ROUTE HIT");
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

Generate a complete learning module for this subtopic.
Return EVERYTHING strictly in valid JSON format with this structure:
{
  "lessonContent": {
    "title": "...",
    "subtopics": [
      {
        "topic": "...",
        "explain": "...",
        "bulletPoints": ["...", "..."],
        "example": "..."
      }
    ]
  },
  "summary": "...",
  "lessonVisualPrompt": "...",
  "lessonSpeechScript": "A full, natural-sounding narration script that covers the entire lesson content, including all subtopics, explanations, and examples, in a conversational way for a student to listen to."
}

Rules:
- lessonContent MUST be an object following the subtopics array structure shown above.
- bulletPoints is optional but recommended for lists.
- example should be a concrete real-world case.
- Do NOT include any explanations, markdown, or text outside this JSON object.`;




    const getAIResponse = async (attempt = 1) => {
      console.log(`AI GENERATION ATTEMPT ${attempt}...`);
      const response = await groqClient.post('/chat/completions', {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: attempt === 1 ? 0.7 : 0.3, // Lower temperature on retry
        max_tokens: 4000
      });
      return response.data?.choices?.[0]?.message?.content || '';
    };

    let rawLesson = await getAIResponse(1);
    let json = fixBrokenJson(rawLesson);

    // RETRY if first attempt fails
    if (!json) {
      console.log("⚠️ ATTEMPT 1 FAILED PARSING, RETRYING...");
      rawLesson = await getAIResponse(2);
      json = fixBrokenJson(rawLesson);
    }

    let lessonContent = '';
    let summary = '';
    let lessonVisualPrompt = '';
    let lessonSpeechScript = '';

    if (json) {
      try {
        const extractString = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'object') {
            return val.content || val.explanation || val.text || JSON.stringify(val);
          }
          return String(val);
        };

        // If lessonContent is already an object (our new structure), keep it. 
        // Otherwise try to extract a string for legacy/fallback.
        lessonContent = typeof json.lessonContent === 'object' ? json.lessonContent : extractString(json.lessonContent);

        if (typeof lessonContent === 'string') {
          lessonContent = lessonContent.replace(/<[^>]*>/g, '').trim();
        }

        summary = extractString(json.summary).trim();
        lessonVisualPrompt = extractString(json.lessonVisualPrompt).trim();
        lessonSpeechScript = extractString(json.lessonSpeechScript).trim();
      } catch (e) {
        console.error('Failed to extract subtopic lesson fields:', e);
      }
    } else {
      console.error("CRITICAL: AI failed to return parseable JSON after retries.");
      console.error("LAST RAW RESPONSE:", rawLesson);
      return res.status(502).json({
        success: false,
        message: "AI returned malformed JSON after multiple attempts. Please try again."
      });
    }

    if (!lessonContent) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return valid JSON lesson content for this subtopic.'
      });
    }

    // IMAGE GENERATION HANDLING MOVED TO FRONTEND (Puter.js)
    // We only return the prompt now.
    let lessonImageUrl = null;
    // if (lessonVisualPrompt && IMAGE_API_BASE && IMAGE_API_TOKEN) {
    //   try {
    //     lessonImageUrl = await generateImageFromAPI(lessonVisualPrompt);
    //   } catch (err) {
    //     console.error("Lesson image generation failed:", err.message);
    //   }
    // }

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
        lessonContent,
        summary,
        lessonVisualPrompt,
        lessonSpeechScript,
        lessonImageUrl
      }
    });
  } catch (error) {
    console.error("FULL GROQ ERROR:", {
      message: error.message,
      data: error.response?.data,
      status: error.response?.status
    });

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
  console.log("-> generateQuizForSubtopics called");
  try {
    const { topic, subtopics } = req.body;
    console.log("Topic:", topic, "Subtopics:", subtopics);

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

    const userPrompt = `Generate 10 multiple-choice questions based on these subtopics for the topic "${topicName}":
${subtopicList.map(s => `- ${s}`).join('\n')}

Each question must have:
- subtopic: which subtopic it belongs to
- questionText: the question
- options: exactly 4 options as an array of strings
- correctAnswer: index of the correct option (0-3)
- questionVisualPrompt: a detailed prompt for an educational, clean, diagram-style illustration that helps explain this specific question
- questionSpeechScript: a clear, conversational narration script for text-to-speech that reads the question and options aloud to students

Return ONLY valid JSON with no comments, explanations, markdown, or extra text:
{
  "questions": [
    {
      "subtopic": "Binary Tree",
      "questionText": "....",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "questionVisualPrompt": "...",
      "questionSpeechScript": "..."
    }
  ]
}`;

    const getAIResponse = async (attempt = 1) => {
      console.log(`QUIZ GENERATION ATTEMPT ${attempt}...`);
      const response = await groqClient.post('/chat/completions', {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: QUESTION_PROMPT_SYSTEM },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: attempt === 1 ? 0.7 : 0.3,
        max_tokens: 3500
      });
      return response.data?.choices?.[0]?.message?.content || '';
    };

    let raw = await getAIResponse(1);
    let json = fixBrokenJson(raw);

    if (!json) {
      console.log("⚠️ QUIZ ATTEMPT 1 FAILED PARSING, RETRYING...");
      raw = await getAIResponse(2);
      json = fixBrokenJson(raw);
    }

    let questions = [];
    if (json && Array.isArray(json.questions)) {
      try {
        const extractString = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'object') {
            return val.text || val.value || JSON.stringify(val);
          }
          return String(val);
        };

        questions = json.questions.map((q, idx) => ({
          _id: `ai-subtopic-q-${idx}`,
          subtopic: extractString(q.subtopic),
          questionText: extractString(q.questionText),
          options: Array.isArray(q.options) ? q.options.map(o => extractString(o)) : [],
          correctOptionIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          questionVisualPrompt: extractString(q.questionVisualPrompt),
          questionSpeechScript: extractString(q.questionSpeechScript),
          questionImageUrl: null
        }));
      } catch (e) {
        console.error('Failed to extract quiz question fields:', e);
      }
    } else {
      console.error("CRITICAL: AI failed to return parseable QUIZ JSON after retries.");
      console.error("LAST RAW RESPONSE:", raw);
      return res.status(502).json({
        success: false,
        message: "AI returned malformed Quiz JSON. Please check your subtopic names and try again."
      });
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

    const prompt = generatedContent.imagePrompt || generatedContent.lessonVisualPrompt || generatedContent.topic;

    // BACKEND IMAGE GENERATION REMOVED
    // Frontend will interpret 'imageUrl: null' + 'imagePrompt' as a signal to generate via Puter.js

    // Return success with null image so frontend knows to generate it
    return res.status(200).json({
      success: true,
      data: {
        topic: generatedContent.topic,
        imageUrl: null,
        imagePrompt: prompt
      }
    });

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

    if (!MURF_API_KEY) {
      return res.status(501).json({
        success: false,
        message: 'Audio generation requires MURF_API_KEY to be set.'
      });
    }
    const textToSpeak = (generatedContent.lessonSpeechScript || generatedContent.audioPrompt || generatedContent.summary || `Lesson about ${topicName}`).substring(0, 5000);
    const murfVoiceId = voiceToUse === 'alloy' ? 'Matthew' : voiceToUse === 'nova' ? 'Emily' : 'Matthew';
    try {
      const audioUrl = await generateSpeechFromMurf(textToSpeak, murfVoiceId);
      generatedContent.audioUrl = audioUrl;
      await generatedContent.save();
      return res.status(200).json({
        success: true,
        message: 'Audio card generated successfully',
        data: {
          topic: generatedContent.topic,
          audioUrl: generatedContent.audioUrl,
          audioPrompt: generatedContent.audioPrompt,
          voice: voiceToUse
        }
      });
    } catch (apiError) {
      console.error('Murf audio generation failed:', apiError.message);
      return res.status(500).json({
        success: false,
        message: apiError.response?.data?.message || 'Failed to generate audio'
      });
    }
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

    const results = { visualCard: null, audioCard: null };

    if (!generatedContent.imageUrl && (IMAGE_API_BASE && IMAGE_API_TOKEN)) {
      try {
        const prompt = generatedContent.imagePrompt || generatedContent.topic;
        generatedContent.imageUrl = await generateImageFromAPI(prompt);
        results.visualCard = { imageUrl: generatedContent.imageUrl, imagePrompt: generatedContent.imagePrompt };
      } catch (e) {
        console.error('Visual card generation failed:', e.message);
        results.visualCard = { error: e.message };
      }
    } else if (generatedContent.imageUrl) {
      results.visualCard = { imageUrl: generatedContent.imageUrl, imagePrompt: generatedContent.imagePrompt, message: 'Already exists' };
    }

    if (!generatedContent.audioUrl && MURF_API_KEY) {
      try {
        const text = (generatedContent.lessonSpeechScript || generatedContent.audioPrompt || generatedContent.summary || `Lesson about ${topicName}`).substring(0, 5000);
        const voiceId = selectedVoice === 'nova' ? 'Emily' : 'Matthew';
        generatedContent.audioUrl = await generateSpeechFromMurf(text, voiceId);
        results.audioCard = { audioUrl: generatedContent.audioUrl, audioPrompt: generatedContent.audioPrompt, voice: selectedVoice };
      } catch (e) {
        console.error('Audio card generation failed:', e.message);
        results.audioCard = { error: e.message };
      }
    } else if (generatedContent.audioUrl) {
      results.audioCard = { audioUrl: generatedContent.audioUrl, audioPrompt: generatedContent.audioPrompt, message: 'Already exists' };
    }

    await generatedContent.save();
    return res.status(200).json({
      success: true,
      message: 'Cards generation completed',
      data: { topic: generatedContent.topic, ...results }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate speech from text (Murf) for frontend play/stop button
// @route   POST /api/ai/speech
// @access  Protected
export const streamSpeech = async (req, res, next) => {
  try {
    const { text, voiceId: bodyVoiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    if (!MURF_API_KEY) {
      return res.status(501).json({ success: false, message: 'Speech requires MURF_API_KEY' });
    }
    const voiceId = (bodyVoiceId && String(bodyVoiceId).trim()) || 'Matthew';
    const audioUrl = await generateSpeechFromMurf(text.trim().substring(0, 5000), voiceId);
    return res.status(200).json({ success: true, data: { audioUrl } });
  } catch (error) {
    console.error('streamSpeech error:', error.message);
    return res.status(500).json({ success: false, message: error.response?.data?.message || 'Failed to generate speech' });
  }
};
