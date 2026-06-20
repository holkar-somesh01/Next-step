const express = require('express');
const router = express.Router();
const { addScheme, getSchemes, deleteScheme, updateScheme } = require('../controllers/scheme.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.post('/', protect, admin, addScheme);
router.get('/', getSchemes);
router.put('/:id', protect, admin, updateScheme);
router.delete('/:id', protect, admin, deleteScheme);

module.exports = router;
