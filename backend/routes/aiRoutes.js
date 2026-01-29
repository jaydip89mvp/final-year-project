import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateLessonAndQuestions,
  getGeneratedContentByTopic
} from '../controllers/aiContentController.js';

const router = express.Router();

// @route   POST /api/ai/generate
// @desc    Generate lesson content and questions using OpenAI
// @access  Protected
router.post('/generate', authenticate, generateLessonAndQuestions);

// @route   GET /api/ai/content/:topic
// @desc    Get generated content by topic
// @access  Protected
router.get('/content/:topic', authenticate, getGeneratedContentByTopic);

export default router;
