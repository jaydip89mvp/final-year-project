import express from 'express';
import { getAllSubjects, createSubject } from '../controllers/subjectController.js';
import { getTopicsBySubjectId, getTopicById, createTopic } from '../controllers/topicController.js';
import { submitQuiz, getRoadmap, logLearningEvent, submitAdaptiveQuiz, getNextTopicForSubject, submitSubjectAdaptiveQuiz, getRoadmapByNode, submitNodeQuiz } from '../controllers/learningController.js';
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

// @route   POST /api/learning/adaptive/submit-quiz
// @desc    Submit adaptive quiz with subtopic-level results
// @access  Protected
router.post('/adaptive/submit-quiz', authenticate, submitAdaptiveQuiz);

// @route   GET /api/learning/subject/:subjectId/next-topic
// @desc    Get next subtopic to study (linear plan; only non-excelled)
// @access  Protected
router.get('/subject/:subjectId/next-topic', authenticate, getNextTopicForSubject);

// @route   POST /api/learning/adaptive/submit-subject-quiz
// @desc    Submit subject-level adaptive quiz
// @access  Protected
router.post('/adaptive/submit-subject-quiz', authenticate, submitSubjectAdaptiveQuiz);

// @route   GET /api/learning/roadmap/node
// @desc    Get roadmap for a node (subject/topic/subtopic). DB first; generate once if missing. Exclude mastered.
// @access  Protected
router.get('/roadmap/node', authenticate, getRoadmapByNode);

// @route   POST /api/learning/adaptive/submit-node-quiz
// @desc    Submit quiz for a roadmap child; update progress (mastered excluded from recommendations)
// @access  Protected
router.post('/adaptive/submit-node-quiz', authenticate, submitNodeQuiz);

export default router;
