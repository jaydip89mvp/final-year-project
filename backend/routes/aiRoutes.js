import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateLessonAndQuestions,
  generateLessonAndQuestionsByStudent,
  getGeneratedContentByTopic,
  getGeneratedContentByTopicAndNeuroType,
  generateVisualCard,
  generateAudioCard,
  generateCards,
  generateLiveLessonAndQuestions,
  generateSubtopics,
  generateSubtopicLesson,
  generateQuizForSubtopics
} from '../controllers/aiContentController.js';

const router = express.Router();

// @route   POST /api/ai/generate
// @desc    Generate lesson (neurodiverse-aware, uses req.userId as studentId)
// @access  Protected
router.post('/generate', authenticate, generateLessonAndQuestions);

// @route   POST /api/ai/live-lesson
// @desc    Generate lesson + questions on-the-fly via Groq (no DB dependency)
// @access  Protected
router.post('/live-lesson', authenticate, generateLiveLessonAndQuestions);

// @route   POST /api/ai/generate-subtopics
// @desc    Generate subtopics for a topic (5–8 logical units)
// @access  Protected
router.post('/generate-subtopics', authenticate, generateSubtopics);

// @route   POST /api/ai/subtopic-lesson
// @desc    Generate learning material for a specific subtopic (no quiz)
// @access  Protected
router.post('/subtopic-lesson', authenticate, generateSubtopicLesson);

// @route   POST /api/ai/generate-quiz
// @desc    Generate quiz questions based on list of subtopics
// @access  Protected
router.post('/generate-quiz', authenticate, generateQuizForSubtopics);

// @route   POST /api/ai/generate/:studentId
// @desc    Generate lesson for student (topic in body). Prompt selected by student neuroType.
// @access  Protected
router.post('/generate/:studentId', authenticate, generateLessonAndQuestionsByStudent);

// More specific route first (two params)
// @route   GET /api/ai/content/:topic/:neuroType
// @desc    Get generated content by topic and neuroType (dyslexia | adhd | autism | general)
// @access  Protected
router.get('/content/:topic/:neuroType', authenticate, getGeneratedContentByTopicAndNeuroType);

// @route   GET /api/ai/content/:topic
// @desc    Get generated content by topic (first match)
// @access  Protected
router.get('/content/:topic', authenticate, getGeneratedContentByTopic);

// @route   POST /api/ai/generate-visual-card
// @desc    Generate visual card (image) for a topic
// @access  Protected
router.post('/generate-visual-card', authenticate, generateVisualCard);

// @route   POST /api/ai/generate-audio-card
// @desc    Generate audio card for a topic
// @access  Protected
router.post('/generate-audio-card', authenticate, generateAudioCard);

// @route   POST /api/ai/generate-cards
// @desc    Generate both visual and audio cards for a topic
// @access  Protected
router.post('/generate-cards', authenticate, generateCards);

export default router;
