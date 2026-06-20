const mongoose = require('mongoose');

const roomConfigSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        unique: true
    },
    deletePolicy: {
        type: String,
        enum: ['off', '24hr', '7days', 'immediately'],
        default: 'off'
    }
}, { timestamps: true });

module.exports = mongoose.model('RoomConfig', roomConfigSchema);
