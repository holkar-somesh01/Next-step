const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    options: [{
        type: String,
        required: true,
    }],
    correctAnswer: {
        type: Number, // Index of the correct option
        required: true,
    },
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    questions: [questionSchema],
    totalMarks: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
