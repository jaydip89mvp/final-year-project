import StudentProfile from '../models/StudentProfile.js';

// @desc    Create student profile
// @route   POST /api/profile/create
// @access  Protected
export const createProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { ageGroup, educationLevel, learningComfort, neuroType, supportLevel } = req.body;

    // Validate required fields
    if (!ageGroup || !educationLevel || !learningComfort) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ageGroup, educationLevel, and learningComfort'
      });
    }

    // Check if profile already exists
    const existingProfile = await StudentProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    }

    // Create profile
    const profile = await StudentProfile.create({
      userId,
      ageGroup,
      educationLevel,
      learningComfort,
      neuroType: neuroType || 'general',
      supportLevel: supportLevel || 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profile/:userId
// @access  Protected
export const getProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Allow users to view their own profile or admin/teacher to view any profile
    if (userId !== req.userId && req.userRole !== 'teacher' && req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const profile = await StudentProfile.findOne({ userId }).populate('userId', 'name email role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/profile/update
// @access  Protected
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { ageGroup, educationLevel, learningComfort, neuroType, supportLevel } = req.body;

    // Find existing profile
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please create a profile first.'
      });
    }

    // Update fields
    if (ageGroup) profile.ageGroup = ageGroup;
    if (educationLevel) profile.educationLevel = educationLevel;
    if (learningComfort) profile.learningComfort = learningComfort;
    if (neuroType) profile.neuroType = neuroType;
    if (supportLevel) profile.supportLevel = supportLevel;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
