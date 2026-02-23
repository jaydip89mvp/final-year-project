import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import ScreeningResponse from '../models/ScreeningResponse.js';
import axios from 'axios';

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
      const user = await User.findById(userId).select('name email role');

      // Check for screening results fallback
      const screening = await ScreeningResponse.findOne({ userId });

      if (user) {
        return res.status(200).json({
          success: true,
          data: {
            userId: user,
            name: user.name,
            email: user.email,
            role: user.role,
            suggestedNeuroType: screening ? screening.prediction : 'general'
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Redact sensitive info for students viewing themselves
    let responseData = profile.toObject();
    if (req.userRole === 'student' && userId === req.userId) {
      delete responseData.neuroType;
      delete responseData.supportLevel;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student/user profile
// @route   PUT /api/profile/update
// @access  Protected
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email, ageGroup, educationLevel, learningComfort, neuroType, supportLevel } = req.body;

    // Update User model fields if provided
    if (name || email) {
      const user = await User.findById(userId);
      if (user) {
        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();
      }
    }

    // Find existing student profile
    let profile = await StudentProfile.findOne({ userId });

    // Only students are expected to have a StudentProfile
    if (req.userRole === 'student') {
      if (!profile) {
        // Create if it doesn't exist for a student (auto-provisioning)
        profile = new StudentProfile({ userId });
      }

      // Allow updating basic fields
      if (ageGroup) profile.ageGroup = ageGroup;
      if (educationLevel) profile.educationLevel = educationLevel;
      if (learningComfort) profile.learningComfort = learningComfort;

      // RESTRICT: Students cannot update neuroType or supportLevel manually
      // They are set during registration/discovery and shouldn't be easily toggled
      if (req.userRole !== 'student') {
        if (neuroType) profile.neuroType = neuroType;
        if (supportLevel) profile.supportLevel = supportLevel;
      }

      await profile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile || { userId }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit screening questionnaire
// @route   POST /api/profile/screening
// @access  Protected
export const submitScreening = async (req, res, next) => {
  try {
    const userId = req.userId;
    const answers = req.body; // Expecting { d1: 1, ..., d30: 5, a1: 1, ..., a30: 5, s1: 1, ..., s30: 5 }

    // Validate if 90 answers are present
    const questionKeys = [
      ...Array.from({ length: 30 }, (_, i) => `D_Q${i + 1}`),
      ...Array.from({ length: 30 }, (_, i) => `A_Q${i + 1}`),
      ...Array.from({ length: 30 }, (_, i) => `S_Q${i + 1}`)
    ];

    for (const key of questionKeys) {
      if (answers[key] === undefined) {
        return res.status(400).json({
          success: false,
          message: `Missing answer for question ${key}`
        });
      }
    }

    // Construct a clean object for the ML service to ensure only answers are sent
    const mlPayload = {};
    for (const key of questionKeys) {
      mlPayload[key] = parseInt(answers[key]);
    }

    // Call ML service for prediction
    let prediction = 'general';
    try {
      const mlResponse = await axios.post('http://localhost:8000/predict-trait', mlPayload);
      const dominantTrait = mlResponse.data.dominant_trait.toLowerCase();

      // Map ML response to our StudentProfile neuroType enum
      if (dominantTrait.includes('dyslexia')) {
        prediction = 'dyslexia';
      } else if (dominantTrait.includes('adhd')) {
        prediction = 'adhd';
      } else if (dominantTrait.includes('asd') || dominantTrait.includes('autism')) {
        prediction = 'autism';
      } else {
        prediction = 'general';
      }
    } catch (mlError) {
      const errorDetail = mlError.response?.data?.detail || mlError.message;
      console.error('Error calling ML service:', errorDetail);
      // Fallback to 'general' if ML service is unavailable
      prediction = 'general';
    }

    // Save responses to database
    const screening = await ScreeningResponse.findOneAndUpdate(
      { userId },
      { ...mlPayload, prediction },
      { upsert: true, new: true }
    );

    // Update StudentProfile with the predicted trait
    let profile = await StudentProfile.findOne({ userId });
    if (profile) {
      profile.neuroType = prediction;
      await profile.save();
    } else {
      // If profile doesn't exist yet, it will be created in the next step (ProfileCreate.jsx)
      // We can pass the trait back to the frontend or rely on the next step to fetch it.
    }

    res.status(200).json({
      success: true,
      message: 'Screening submitted and analyzed successfully',
      data: {
        prediction,
        screeningId: screening._id
      }
    });

  } catch (error) {
    next(error);
  }
};
