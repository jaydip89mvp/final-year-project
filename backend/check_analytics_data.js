import mongoose from 'mongoose';
import RoadmapProgress from './models/RoadmapProgress.js';
import Progress from './models/Progress.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({ role: 'student' }).limit(5);
        if (users.length === 0) {
            console.log("No students found.");
            return;
        }

        for (const user of users) {
            console.log(`\n--- Analytics Audit for Student: ${user.name} (${user._id}) ---`);

            const progress = await Progress.find({ studentId: user._id });
            console.log(`Dedicated Topics: ${progress.length}`);
            progress.forEach(p => {
                if (p.attempts > 0 || p.timeSpentSeconds > 0) {
                    console.log(`  - TopicID: ${p.topicId}, Score: ${p.score}, Att: ${p.attempts}, Time: ${p.timeSpentSeconds}s`);
                }
            });

            const events = await LearningEvent.find({ studentId: user._id, timeSpentSeconds: { $gt: 0 } });
            console.log(`Events with time: ${events.length}`);
            events.forEach(e => console.log(`  - Type: ${e.eventType}, Time: ${e.timeSpentSeconds}s, Topic: ${e.topicId || e.details?.nodeName}`));

            const roadmapProgress = await RoadmapProgress.find({ studentId: user._id });
            console.log(`Roadmap Nodes: ${roadmapProgress.length}`);
            roadmapProgress.forEach(rp => {
                const active = rp.childrenProgress.filter(c => c.attempts > 0 || c.timeSpentSeconds > 0);
                if (active.length > 0) {
                    console.log(`  - NodeKey: ${rp.nodeKey}`);
                    active.forEach(c => {
                        console.log(`    * Child: ${c.name}, Status: ${c.status}, Score: ${c.masteryScore}, Att: ${c.attempts}, Time: ${c.timeSpentSeconds}s`);
                    });
                }
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
