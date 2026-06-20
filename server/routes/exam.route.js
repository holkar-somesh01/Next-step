const express = require('express');
const router = express.Router();
const {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam
} = require('../controllers/exam.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.route('/')
    .get(getExams)
    .post(protect, admin, createExam);

router.route('/:id')
    .get(getExamById)
    .put(protect, admin, updateExam)
    .delete(protect, admin, deleteExam);

module.exports = router;
