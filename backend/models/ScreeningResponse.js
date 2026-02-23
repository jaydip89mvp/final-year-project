import mongoose from 'mongoose';

const screeningResponseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Dyslexia Questions (D_Q1-D_Q30)
    ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`D_Q${i + 1}`, { type: Number, required: true, min: 1, max: 5 }])),

    // ADHD Questions (A_Q1-A_Q30)
    ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`A_Q${i + 1}`, { type: Number, required: true, min: 1, max: 5 }])),

    // ASD Questions (S_Q1-S_Q30)
    ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`S_Q${i + 1}`, { type: Number, required: true, min: 1, max: 5 }])),

    prediction: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const ScreeningResponse = mongoose.model('ScreeningResponse', screeningResponseSchema);

export default ScreeningResponse;
