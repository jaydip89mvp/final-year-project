
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RoadmapProgress from '../models/RoadmapProgress.js';
import LearningEvent from '../models/LearningEvent.js';

dotenv.config({ path: './.env' });

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const studentId = new mongoose.Types.ObjectId();
        const subjectId = new mongoose.Types.ObjectId();
        const nodeKey = `subject_${subjectId}_root`;
        const childName = "Test Node";

        console.log('\n--- RoadmapProgress Test ---');
        // 1. Initial Insert
        await RoadmapProgress.create({
            studentId,
            nodeKey,
            childrenProgress: [{
                name: childName,
                status: 'weak',
                masteryScore: 0.5,
                correct: 5,
                total: 10,
                attempts: 1,
                timeSpentSeconds: 60,
                lastAttempt: new Date()
            }]
        });

        // 2. Second Attempt (Simulation)
        let progress = await RoadmapProgress.findOne({ studentId, nodeKey });
        let idx = progress.childrenProgress.findIndex(p => p.name === childName);
        let prev = progress.childrenProgress[idx];

        progress.childrenProgress[idx] = {
            ...prev.toObject(),
            correct: (prev.correct || 0) + 8,
            total: (prev.total || 0) + 10,
            attempts: (prev.attempts || 0) + 1,
            timeSpentSeconds: (prev.timeSpentSeconds || 0) + 30,
            lastAttempt: new Date()
        };
        progress.markModified('childrenProgress');
        await progress.save();

        console.log('Final RoadmapProgress Attempts:', progress.childrenProgress[idx].attempts);
        console.log('Final RoadmapProgress Correct:', progress.childrenProgress[idx].correct);
        console.log('Final RoadmapProgress Time:', progress.childrenProgress[idx].timeSpentSeconds);

        if (progress.childrenProgress[idx].attempts === 2 &&
            progress.childrenProgress[idx].correct === 13 &&
            progress.childrenProgress[idx].timeSpentSeconds === 90) {
            console.log('SUCCESS: RoadmapProgress Persistence OK');
        } else {
            console.log('FAILURE: RoadmapProgress Persistence MISMATCH');
        }

        console.log('\n--- LearningEvent Test ---');
        const eventParams = {
            studentId,
            subjectId,
            eventType: 'roadmap_quiz_attempt',
            "details.nodeKey": nodeKey,
            "details.nodeName": childName
        };

        // Attempt 1
        await LearningEvent.findOneAndUpdate(
            eventParams,
            {
                $set: { score: 50, correct: 5, totalQuestions: 10, timestamp: new Date(), completed: true, details: { nodeKey, nodeName: childName } },
                $inc: { timeSpentSeconds: 60, attemptNumber: 1 }
            },
            { upsert: true, new: true }
        );

        // Attempt 2
        const secondEvent = await LearningEvent.findOneAndUpdate(
            eventParams,
            {
                $set: { score: 80, correct: 8, totalQuestions: 10, timestamp: new Date(), completed: true, details: { nodeKey, nodeName: childName } },
                $inc: { timeSpentSeconds: 30, attemptNumber: 1 }
            },
            { upsert: true, new: true }
        );

        console.log('Final LearningEvent Attempt Number:', secondEvent.attemptNumber);
        console.log('Final LearningEvent Total Time:', secondEvent.timeSpentSeconds);

        if (secondEvent.attemptNumber === 2 && secondEvent.timeSpentSeconds === 90) {
            console.log('SUCCESS: LearningEvent Persistence OK');
        } else {
            console.log('FAILURE: LearningEvent Persistence MISMATCH');
        }

        // Cleanup
        await RoadmapProgress.deleteOne({ studentId });
        await LearningEvent.deleteOne({ studentId });
        console.log('\nVerification Complete & Cleanup Done.');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

verify();
