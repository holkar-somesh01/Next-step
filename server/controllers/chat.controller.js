const Chat = require('../models/chat.model');
const SecretContact = require('../models/secretContact.model');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');
const { activeUsers, sendPushNotification } = require('../utils/notification');

// @desc    Get chat history between two users
// @route   GET /api/chats/:receiverId
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user._id;

    const chats = await Chat.find({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    }).sort({ createdAt: 1 });

    // Mark incoming messages from the receiver to the sender as read
    await Chat.updateMany(
        { sender: receiverId, receiver: senderId, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json(chats);
});

// @desc    Save a new message
// @route   POST /api/chats
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, message, room } = req.body;
    const senderId = req.user._id;

    const newChat = await Chat.create({
        sender: senderId,
        receiver: receiverId,
        message,
        room
    });

    // Ensure the receiver has the sender in their secret contacts list
    const sender = await User.findById(senderId);
    if (sender) {
        let contact = await SecretContact.findOne({
            owner: receiverId,
            $or: [
                { contactUserId: senderId },
                { mobile: sender.mobile }
            ]
        });

        if (!contact) {
            await SecretContact.create({
                owner: receiverId,
                name: sender.name,
                mobile: sender.mobile,
                contactUserId: senderId
            });
        } else if (!contact.contactUserId) {
            contact.contactUserId = senderId;
            await contact.save();
        }
    }

    // Send push notification if receiver is not active
    if (!activeUsers.has(receiverId.toString())) {
        sendPushNotification(receiverId).catch(err => console.error('[Notification] Error dispatching async push notification:', err));
    }

    res.status(201).json(newChat);
});

// @desc    Edit a message
// @route   PUT /api/chats/:messageId
// @access  Private
const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { message } = req.body;

    const chat = await Chat.findById(messageId);
    if (!chat) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (chat.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this message');
    }

    chat.message = message;
    const updatedChat = await chat.save();
    res.status(200).json(updatedChat);
});

// @desc    Delete a message
// @route   DELETE /api/chats/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const chat = await Chat.findById(messageId);
    if (!chat) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (chat.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this message');
    }

    await chat.deleteOne();
    res.status(200).json({ message: 'Message deleted successfully', messageId });
});

module.exports = {
    getChatHistory,
    sendMessage,
    editMessage,
    deleteMessage
};
