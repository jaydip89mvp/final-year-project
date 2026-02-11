import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject.js';

dotenv.config();

const seedSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const subjects = [
            { subjectName: 'Mathematics', syllabusDescription: 'Algebra, Calculus, Geometry, and Statistics.' },
            { subjectName: 'Physics', syllabusDescription: 'Mechanics, Thermodynamics, Electromagnetism, and Quantum Physics.' },
            { subjectName: 'Computer Science', syllabusDescription: 'Algorithms, Data Structures, Web Development, and AI.' },
            { subjectName: 'Biology', syllabusDescription: 'Cell Biology, Genetics, Evolution, and Ecology.' },
            { subjectName: 'History', syllabusDescription: 'World History, Ancient Civilizations, and Modern Era.' }
        ];

        await Subject.deleteMany({}); // Clear existing
        await Subject.insertMany(subjects);

        console.log('Subjects Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding subjects:', error);
        process.exit(1);
    }
};

seedSubjects();
