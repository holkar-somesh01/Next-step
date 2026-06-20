const Contact = require('../models/contact.model');
const asyncHandler = require('express-async-handler');

// @desc    Submit a contact form
// @route   POST /api/contacts
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const contact = await Contact.create({
        name,
        email,
        subject,
        message
    });

    if (contact) {
        res.status(201).json(contact);
    } else {
        res.status(400);
        throw new Error('Invalid contact data');
    }
});

// @desc    Get all contact submissions
// @route   GET /api/contacts
// @access  Private/Admin
const getContactSubmissions = asyncHandler(async (req, res) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
});

module.exports = {
    submitContactForm,
    getContactSubmissions
};
