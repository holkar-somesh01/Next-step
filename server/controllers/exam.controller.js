const Exam = require('../models/exam.model');
const asyncHandler = require('express-async-handler');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = asyncHandler(async (req, res) => {
    const { title, description, duration, category, questions } = req.body;

    if (!title || !description || !duration || !category || !questions) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const exam = await Exam.create({
        title,
        description,
        duration,
        category,
        questions,
        totalMarks: questions.length // Assuming 1 mark per question
    });

    if (exam) {
        res.status(201).json(exam);
    } else {
        res.status(400);
        throw new Error('Invalid exam data');
    }
});

// @desc    Get all exams
// @route   GET /api/exams
// @access  Public
const getExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({});
    res.json(exams);
});

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Public
const getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        res.json(exam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        exam.title = req.body.title || exam.title;
        exam.description = req.body.description || exam.description;
        exam.duration = req.body.duration || exam.duration;
        exam.category = req.body.category || exam.category;
        exam.questions = req.body.questions || exam.questions;
        exam.totalMarks = req.body.questions ? req.body.questions.length : exam.totalMarks;

        const updatedExam = await exam.save();
        res.json(updatedExam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        await exam.deleteOne();
        res.json({ message: 'Exam removed' });
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

module.exports = {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam
};
