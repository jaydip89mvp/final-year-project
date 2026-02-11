import express from 'express';
import { getAllSubjects, createSubject } from '../controllers/subjectController.js';
import { getTopicsBySubjectId, getTopicById, createTopic } from '../controllers/topicController.js';
import { submitQuiz, getRoadmap, logLearningEvent } from '../controllers/learningController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/learning/subjects
// @desc    Get all subjects
// @access  Public
router.get('/subjects', getAllSubjects);

// @route   POST /api/learning/subjects
// @desc    Create new subject (admin/teacher only)
// @access  Protected
router.post('/subjects', authenticate, createSubject);

// @route   POST /api/learning/topics
// @desc    Create new topic (teacher only)
// @access  Protected
router.post('/topics', authenticate, createTopic);

// @route   GET /api/learning/topics/:subjectId
// @desc    Get topics by subject ID
// @access  Public
router.get('/topics/:subjectId', getTopicsBySubjectId);

// @route   GET /api/learning/topic/:topicId
// @desc    Get topic by ID with adaptive content
// @access  Protected
router.get('/topic/:topicId', authenticate, getTopicById);

// @route   POST /api/learning/submit-quiz
// @desc    Submit quiz and evaluate performance
// @access  Protected
router.post('/submit-quiz', authenticate, submitQuiz);

// @route   GET /api/learning/roadmap/:studentId/:subjectId
// @desc    Get adaptive roadmap for student
// @access  Protected
router.get('/roadmap/:studentId/:subjectId', authenticate, getRoadmap);

// @route   POST /api/learning/event
// @desc    Log a learning event
// @access  Protected
router.post('/event', authenticate, logLearningEvent);

export default router;
