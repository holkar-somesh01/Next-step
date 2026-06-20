const Scheme = require('../models/scheme.model');
const asyncHandler = require('express-async-handler');

// @desc    Add a new scheme
// @route   POST /api/schemes
// @access  Private/Admin
const addScheme = asyncHandler(async (req, res) => {
    const { name, description, link, eligibilityCriteria, category, deadline } = req.body;

    if (!name || !description || !link || !eligibilityCriteria) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const scheme = await Scheme.create({
        name,
        description,
        link,
        eligibilityCriteria,
        category,
        deadline
    });

    if (scheme) {
        res.status(201).json(scheme);
    } else {
        res.status(400);
        throw new Error('Invalid scheme data');
    }
});

// @desc    Get all schemes
// @route   GET /api/schemes
// @access  Public
const getSchemes = asyncHandler(async (req, res) => {
    const schemes = await Scheme.find({});
    res.json(schemes);
});

// @desc    Delete a scheme
// @route   DELETE /api/schemes/:id
// @access  Private/Admin
const deleteScheme = asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);

    if (scheme) {
        await scheme.deleteOne();
        res.json({ message: 'Scheme removed' });
    } else {
        res.status(404);
        throw new Error('Scheme not found');
    }
});

// @desc    Update a scheme
// @route   PUT /api/schemes/:id
// @access  Private/Admin
const updateScheme = asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);

    if (scheme) {
        scheme.name = req.body.name || scheme.name;
        scheme.description = req.body.description || scheme.description;
        scheme.link = req.body.link || scheme.link;
        scheme.eligibilityCriteria = req.body.eligibilityCriteria || scheme.eligibilityCriteria;
        scheme.category = req.body.category || scheme.category;
        scheme.deadline = req.body.deadline || scheme.deadline;

        const updatedScheme = await scheme.save();
        res.json(updatedScheme);
    } else {
        res.status(404);
        throw new Error('Scheme not found');
    }
});

module.exports = {
    addScheme,
    getSchemes,
    deleteScheme,
    updateScheme
};
