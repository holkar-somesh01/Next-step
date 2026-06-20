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
    const contacts = await SecretContact.find({ owner: req.user._id });

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
    const populated = await SecretContact.populate(updatedContacts, {
        path: 'contactUserId',
        select: 'name email profileImage mobile'
    });

    // Query last messages and unread counts for each contact
    const contactsData = [];
    for (let contact of populated) {
        const contactObj = contact.toObject();
        if (contact.contactUserId) {
            const contactUserId = contact.contactUserId._id;

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
        } else {
            contactObj.lastMessage = null;
            contactObj.unreadCount = 0;
        }
        contactsData.push(contactObj);
    }

    // Sort by name
    contactsData.sort((a, b) => a.name.localeCompare(b.name));

    res.json(contactsData);
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
    deleteSecretContact
};
