import express from 'express';
import { createProfile, getProfileByUserId, updateProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// @route   POST /api/profile/create
// @desc    Create student profile
// @access  Protected
router.post('/create', createProfile);

// @route   GET /api/profile/:userId
// @desc    Get profile by user ID
// @access  Protected
router.get('/:userId', getProfileByUserId);

// @route   PUT /api/profile/update
// @desc    Update student profile
// @access  Protected
router.put('/update', updateProfile);

export default router;
