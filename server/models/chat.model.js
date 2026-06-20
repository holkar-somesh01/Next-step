const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },
    deletePolicy: {
        type: String,
        enum: ['off', '24hr', '7days', 'immediately'],
        default: 'off'
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Chat', chatSchema);
