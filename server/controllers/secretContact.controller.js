const SecretContact = require('../models/secretContact.model');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const asyncHandler = require('express-async-handler');

// @desc    Add a new secret contact
// @route   POST /api/secret-contacts
// @access  Private
const addSecretContact = asyncHandler(async (req, res) => {
    const { name, mobile } = req.body;
    const ownerId = req.user._id;

    if (!name || !mobile) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user with this mobile exists in our system
    const registeredUser = await User.findOne({ mobile });

    const contact = await SecretContact.create({
        owner: ownerId,
        name,
        mobile,
        contactUserId: registeredUser ? registeredUser._id : null
    });

    if (contact) {
        res.status(201).json(contact);
    } else {
        res.status(400);
        throw new Error('Invalid contact data');
    }
});

// @desc    Get all secret contacts for the logged in user
// @route   GET /api/secret-contacts
// @access  Private
const getSecretContacts = asyncHandler(async (req, res) => {
    let contacts = await SecretContact.find({ owner: req.user._id });
    const currentUserDoc = await User.findById(req.user._id);

    const updatedContacts = [];
    for (let contact of contacts) {
        if (!contact.contactUserId) {
            // Check if user has registered now
            const registeredUser = await User.findOne({ mobile: contact.mobile });
            if (registeredUser) {
                contact.contactUserId = registeredUser._id;
                await contact.save();
            }
        }
        updatedContacts.push(contact);
    }

    // Populate
    let populated = await SecretContact.populate(updatedContacts, {
        path: 'contactUserId',
        select: 'name email profileImage mobile'
    });

    // Find all users we have chat history with
    const chatUserIds = await Chat.distinct('receiver', { sender: req.user._id });
    const chatSenderIds = await Chat.distinct('sender', { receiver: req.user._id });
    const uniqueChatUserIds = [...new Set([...chatUserIds, ...chatSenderIds])].map(id => id.toString()).filter(id => id !== req.user._id.toString());

    // Get IDs of users currently saved in secret contacts
    const savedUserIds = populated.map(c => c.contactUserId?._id?.toString()).filter(Boolean);

    // Filter out missing users
    const missingUserIds = uniqueChatUserIds.filter(id => !savedUserIds.includes(id));

    if (missingUserIds.length > 0) {
        const missingUsers = await User.find({ _id: { $in: missingUserIds } });
        for (let user of missingUsers) {
            populated.push({
                _id: `virtual-${user._id}`,
                owner: req.user._id,
                name: user.name, // Always show their name
                mobile: user.mobile,
                contactUserId: user,
                isVirtual: true
            });
        }
    }

    // Query last messages and unread counts for each contact
    const contactsData = [];
    for (let contact of populated) {
        const contactObj = contact.toObject ? contact.toObject() : { ...contact };
        if (contactObj.contactUserId) {
            const contactUserId = contactObj.contactUserId._id;

            const lastChat = await Chat.findOne({
                $or: [
                    { sender: req.user._id, receiver: contactUserId },
                    { sender: contactUserId, receiver: req.user._id }
                ]
            }).sort({ createdAt: -1 });

            const unreadCount = await Chat.countDocuments({
                sender: contactUserId,
                receiver: req.user._id,
                isRead: false
            });

            if (lastChat) {
                contactObj.lastMessage = {
                    message: lastChat.message,
                    createdAt: lastChat.createdAt
                };
            } else {
                contactObj.lastMessage = null;
            }
            contactObj.unreadCount = unreadCount;
            contactObj.isMuted = currentUserDoc?.mutedUsers?.some(id => id.toString() === contactUserId.toString()) || false;
            contactObj.isBlocked = currentUserDoc?.blockedUsers?.some(id => id.toString() === contactUserId.toString()) || false;
        } else {
            contactObj.lastMessage = null;
            contactObj.unreadCount = 0;
            contactObj.isMuted = false;
            contactObj.isBlocked = false;
        }
        contactsData.push(contactObj);
    }

    // Sort: pinned contacts first, then by name
    contactsData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.name.localeCompare(b.name);
    });

    res.json(contactsData);
});

// @desc    Update a secret contact
// @route   PUT /api/secret-contacts/:id
// @access  Private
const updateSecretContact = asyncHandler(async (req, res) => {
    const { name, mobile } = req.body;
    const contact = await SecretContact.findOne({ _id: req.params.id, owner: req.user._id });

    if (!contact) {
        res.status(404);
        throw new Error('Contact not found');
    }

    if (name) contact.name = name;
    if (mobile) {
        contact.mobile = mobile;
        // Recheck registered status
        const registeredUser = await User.findOne({ mobile });
        contact.contactUserId = registeredUser ? registeredUser._id : null;
    }
    if (req.body.isPinned !== undefined) contact.isPinned = req.body.isPinned;
    if (req.body.isMarkedUnread !== undefined) contact.isMarkedUnread = req.body.isMarkedUnread;

    const updatedContact = await contact.save();
    res.json(updatedContact);
});

// @desc    Delete a secret contact
// @route   DELETE /api/secret-contacts/:id
// @access  Private
const deleteSecretContact = asyncHandler(async (req, res) => {
    const contact = await SecretContact.findOne({ _id: req.params.id, owner: req.user._id });

    if (contact) {
        await contact.deleteOne();
        res.json({ message: 'Contact removed' });
    } else {
        res.status(404);
        throw new Error('Contact not found');
    }
});

module.exports = {
    addSecretContact,
    getSecretContacts,
    updateSecretContact,
    deleteSecretContact
};
