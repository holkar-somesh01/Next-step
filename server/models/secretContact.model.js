const mongoose = require('mongoose');

const secretContactSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    contactUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Ensure a user can't add the same mobile twice
secretContactSchema.index({ owner: 1, mobile: 1 }, { unique: true });

const SecretContact = mongoose.model('SecretContact', secretContactSchema);

module.exports = SecretContact;
