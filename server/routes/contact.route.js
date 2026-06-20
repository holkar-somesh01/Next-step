const express = require('express');
const router = express.Router();
const { submitContactForm, getContactSubmissions } = require('../controllers/contact.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.post('/', submitContactForm);
router.get('/', protect, admin, getContactSubmissions);

module.exports = router;
