import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject.js';
import Topic from './models/Topic.js';

dotenv.config();

const seedTopics = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing topics
        await Topic.deleteMany({});
        console.log('Cleared existing topics');

        const subjects = await Subject.find({});
        if (subjects.length === 0) {
            console.log('No subjects found! Run seedSubjects.js first.');
            process.exit(1);
        }

        const topics = [];

        for (const subject of subjects) {
            if (subject.subjectName === 'Mathematics') {
                topics.push({
                    subjectId: subject._id,
                    topicTitle: 'Introduction to Algebra',
                    difficultyLevel: 'Easy',
                    normalContent: '# Introduction to Algebra\nAlgebra is the study of mathematical symbols and the rules for manipulating these symbols...',
                    simplifiedContent: '# Basic Algebra\nAlgebra uses letters to represent numbers we don\'t know yet. For example, x + 2 = 5.',
                    multimediaLinks: ['https://www.youtube.com/watch?v=NybHckSEQBI']
                }, {
                    subjectId: subject._id,
                    topicTitle: 'Linear Equations',
                    difficultyLevel: 'Medium',
                    normalContent: '# Linear Equations\nA linear equation is an equation between two variables that gives a straight line when plotted on a graph.',
                    simplifiedContent: '# Simple Line Equations\nEquations that draw straight lines.',
                    multimediaLinks: []
                });
            } else if (subject.subjectName === 'Physics') {
                topics.push({
                    subjectId: subject._id,
                    topicTitle: 'Newton\'s Laws of Motion',
                    difficultyLevel: 'Medium',
                    normalContent: '# Newton\'s Laws\n1. Use of Inertia\n2. F=ma\n3. Action-Reaction',
                    simplifiedContent: '# How Things Move\n1. Things keep moving unless stopped.\n2. Pushing harder makes it go faster.\n3. Every push pushes back.',
                    multimediaLinks: ['https://www.youtube.com/watch?v=kKKM8Y-u7ds']
                });
            } else if (subject.subjectName === 'Computer Science') {
                topics.push({
                    subjectId: subject._id,
                    topicTitle: 'Introduction to Python',
                    difficultyLevel: 'Easy',
                    normalContent: '# Python Programming\nPython is a high-level, interpreted programming language...',
                    simplifiedContent: '# Learn Python\nPython is a coding language that is easy to read.',
                    multimediaLinks: []
                });
            }
        }

        if (topics.length > 0) {
            await Topic.insertMany(topics);
            console.log(`Seeded ${topics.length} topics successfully.`);
        } else {
            console.log('No matching subjects found to seed topics for.');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding topics:', error);
        process.exit(1);
    }
};

seedTopics();
