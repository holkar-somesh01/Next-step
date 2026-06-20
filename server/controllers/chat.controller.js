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
    })
    .sort({ createdAt: 1 })
    .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
    });

    // Mark incoming messages from the receiver to the sender as read
    await Chat.updateMany(
        { sender: receiverId, receiver: senderId, isRead: false },
        { $set: { isRead: true } }
    );

    // Clear manual unread status for this contact
    const contact = await SecretContact.findOne({ owner: senderId, contactUserId: receiverId });
    if (contact && contact.isMarkedUnread) {
        contact.isMarkedUnread = false;
        await contact.save();
    }

    res.status(200).json(chats);
});

// @desc    Save a new message
// @route   POST /api/chats
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, message, room, replyTo } = req.body;
    const senderId = req.user._id;

    // Check blocked status
    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
        res.status(404);
        throw new Error('Receiver not found');
    }

    const isBlockedByReceiver = receiverUser.blockedUsers?.some(id => id.toString() === senderId.toString());
    if (isBlockedByReceiver) {
        res.status(400);
        throw new Error('You are blocked by this user');
    }

    const sender = await User.findById(senderId);
    const isBlockedByMe = sender?.blockedUsers?.some(id => id.toString() === receiverId.toString());
    if (isBlockedByMe) {
        res.status(400);
        throw new Error('You have blocked this user. Unblock them to send a message.');
    }

    let newChat = await Chat.create({
        sender: senderId,
        receiver: receiverId,
        message,
        room,
        replyTo: replyTo || null
    });

    // Populate replyTo and its sender nestedly
    newChat = await Chat.findById(newChat._id).populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
    });

    // Ensure the receiver has the sender in their secret contacts list
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

    // Send push notification if receiver is not active and hasn't muted the sender
    const isMuted = receiverUser.mutedUsers?.some(id => id.toString() === senderId.toString());
    if (!activeUsers.has(receiverId.toString()) && !isMuted) {
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

// @desc    Clear chat history with a user
// @route   DELETE /api/chats/clear/:receiverId
// @access  Private
const clearChatHistory = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user._id;

    await Chat.deleteMany({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    });

    res.status(200).json({ success: true, message: 'Chat history cleared successfully', receiverId });
});

// @desc    Mark all messages from sender as read
// @route   PUT /api/chats/read/:senderId
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const { senderId } = req.params;
    const receiverId = req.user._id;

    await Chat.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { $set: { isRead: true } }
    );

    const contact = await SecretContact.findOne({ owner: receiverId, contactUserId: senderId });
    if (contact) {
        contact.isMarkedUnread = false;
        await contact.save();
    }

    res.status(200).json({ success: true, message: 'All messages marked as read' });
});

module.exports = {
    getChatHistory,
    sendMessage,
    editMessage,
    deleteMessage,
    clearChatHistory,
    markAsRead
};
