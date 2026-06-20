const Chat = require('../models/chat.model');
const SecretContact = require('../models/secretContact.model');
const User = require('../models/user.model');
const RoomConfig = require('../models/roomConfig.model');
const asyncHandler = require('express-async-handler');
const { activeUsers, sendPushNotification } = require('../utils/notification');
const { encrypt, decrypt } = require('../utils/encryption');
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
    // For 'immediately' delete policy, set expiresAt to now so it gets deleted
    await Chat.updateMany(
        { sender: receiverId, receiver: senderId, isRead: false, deletePolicy: 'immediately' },
        { $set: { isRead: true, expiresAt: new Date() } }
    );

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

    const decryptedChats = chats.map(chat => {
        const chatObj = chat.toObject();
        chatObj.message = decrypt(chatObj.message);
        if (chatObj.replyTo && chatObj.replyTo.message) {
            chatObj.replyTo.message = decrypt(chatObj.replyTo.message);
        }
        return chatObj;
    });

    res.status(200).json(decryptedChats);
});

// @desc    Save a new message
// @route   POST /api/chats
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, message, room, replyTo, deletePolicy } = req.body;
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

    let expiresAt = null;
    if (deletePolicy === '24hr') {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (deletePolicy === '7days') {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    let newChat = await Chat.create({
        sender: senderId,
        receiver: receiverId,
        message: encrypt(message),
        room,
        replyTo: replyTo || null,
        deletePolicy: deletePolicy || 'off',
        expiresAt
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

    const chatObj = newChat.toObject();
    chatObj.message = decrypt(chatObj.message);
    if (chatObj.replyTo && chatObj.replyTo.message) {
        chatObj.replyTo.message = decrypt(chatObj.replyTo.message);
    }

    res.status(201).json(chatObj);
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

    chat.message = encrypt(message);
    const updatedChat = await chat.save();
    
    const chatObj = updatedChat.toObject();
    chatObj.message = decrypt(chatObj.message);
    if (chatObj.replyTo && chatObj.replyTo.message) {
        chatObj.replyTo.message = decrypt(chatObj.replyTo.message);
    }
    
    res.status(200).json(chatObj);
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

    // For 'immediately' delete policy, set expiresAt to now so it gets deleted
    await Chat.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false, deletePolicy: 'immediately' },
        { $set: { isRead: true, expiresAt: new Date() } }
    );

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

// @desc    Update room config
// @route   PUT /api/chats/config/:room
// @access  Private
const updateRoomPolicy = asyncHandler(async (req, res) => {
    const { room } = req.params;
    const { deletePolicy } = req.body;
    let config = await RoomConfig.findOne({ room });
    if (!config) {
        config = await RoomConfig.create({ room, deletePolicy });
    } else {
        config.deletePolicy = deletePolicy;
        await config.save();
    }
    res.status(200).json(config);
});

// @desc    Get room config
// @route   GET /api/chats/config/:room
// @access  Private
const getRoomPolicy = asyncHandler(async (req, res) => {
    const { room } = req.params;
    const config = await RoomConfig.findOne({ room });
    res.status(200).json(config || { room, deletePolicy: 'off' });
});

module.exports = {
    getChatHistory,
    sendMessage,
    editMessage,
    deleteMessage,
    clearChatHistory,
    markAsRead,
    updateRoomPolicy,
    getRoomPolicy
};
