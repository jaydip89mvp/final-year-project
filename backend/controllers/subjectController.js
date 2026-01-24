import Subject from '../models/Subject.js';

// @desc    Get all subjects
// @route   GET /api/learning/subjects
// @access  Public
export const getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new subject
// @route   POST /api/learning/subjects
// @access  Protected (Admin/Teacher only)
export const createSubject = async (req, res, next) => {
  try {
    // Check if user is teacher or admin (assuming admin role exists or teacher can create)
    if (req.userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can create subjects.'
      });
    }

    const { subjectName, syllabusDescription } = req.body;

    if (!subjectName || !syllabusDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectName and syllabusDescription'
      });
    }

    const subject = await Subject.create({
      subjectName,
      syllabusDescription
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};
