import Topic from '../models/Topic.js';
import StudentProfile from '../models/StudentProfile.js';

// @desc    Get topics by subject ID
// @route   GET /api/learning/topics/:subjectId
// @access  Public
export const getTopicsBySubjectId = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const topics = await Topic.find({ subjectId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get topic by ID with adaptive content
// @route   GET /api/learning/topic/:topicId
// @access  Protected
export const getTopicById = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const userId = req.userId;

    // Find topic
    const topic = await Topic.findById(topicId).populate('subjectId', 'subjectName');
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Get student profile to determine content type
    const profile = await StudentProfile.findOne({ userId });

    // Adaptive content delivery based on neuroType
    let content;
    if (profile && profile.neuroType === 'dyslexia') {
      content = topic.simplifiedContent;
    } else {
      content = topic.normalContent;
    }

    // Return topic with appropriate content
    const topicResponse = {
      topicId: topic._id,
      subjectId: topic.subjectId,
      topicTitle: topic.topicTitle,
      difficultyLevel: topic.difficultyLevel,
      content: content,
      contentType: profile && profile.neuroType === 'dyslexia' ? 'simplified' : 'normal',
      multimediaLinks: topic.multimediaLinks
    };

    res.status(200).json({
      success: true,
      data: topicResponse
    });
  } catch (error) {
    next(error);
  }
};
