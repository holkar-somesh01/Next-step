const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    eligibilityCriteria: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: 'General',
    },
    deadline: {
        type: String,
        default: 'Not Specified',
    }
}, { timestamps: true });

const Scheme = mongoose.model('Scheme', schemeSchema);

module.exports = Scheme;
