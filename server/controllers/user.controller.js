const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const path = require('path');

const fs = require('fs');

const logDebug = (msg) => {
    try {
        fs.appendFileSync(path.join(__dirname, '../debug.log'), `[${new Date().toISOString()}] [controller] ${msg}\n`);
    } catch (e) {
        console.error(e);
    }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, mobile, role } = req.body;
    logDebug(`registerUser called: body=${JSON.stringify(req.body)}`);

    if (!name || !email || !password || !mobile) {
        logDebug(`registerUser failed: missing fields (name=${name}, email=${email}, mobile=${mobile})`);
        res.status(400);
        throw new Error('Please add all fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        logDebug(`registerUser failed: User already exists (${email})`);
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: role || 'student'
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasSecretCode: !!user.secretCode,
            secretCodeLength: user.secretCode ? (user.secretCodeLength || 6) : 0,
            hasAppLockCode: !!user.appLockCode,
            appLockCodeLength: user.appLockCode ? (user.appLockCodeLength || 6) : 0,
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasSecretCode: !!user.secretCode,
            secretCodeLength: user.secretCode ? (user.secretCodeLength || 6) : 0,
            hasAppLockCode: !!user.appLockCode,
            appLockCodeLength: user.appLockCode ? (user.appLockCodeLength || 6) : 0,
            publicKey: user.publicKey || '',
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Get single user by ID
// @route   GET /api/auth/user/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json(user);
});

// @desc    Get current logged-in user (session restore)
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
        hasSecretCode: !!user.secretCode,
        secretCodeLength: user.secretCode ? (user.secretCodeLength || 6) : 0,
        hasAppLockCode: !!user.appLockCode,
        appLockCodeLength: user.appLockCode ? (user.appLockCodeLength || 6) : 0,
        publicKey: user.publicKey || '',
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    // user.mobile = req.body.mobile || user.mobile; // Mobile number update disabled

    if (req.file) {
        user.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        hasSecretCode: !!updatedUser.secretCode,
        secretCodeLength: updatedUser.secretCode ? (updatedUser.secretCodeLength || 6) : 0,
        hasAppLockCode: !!updatedUser.appLockCode,
        appLockCodeLength: updatedUser.appLockCode ? (updatedUser.appLockCodeLength || 6) : 0,
    });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!currentPassword || !newPassword) { res.status(400); throw new Error('Please provide current and new password'); }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) { res.status(401); throw new Error('Current password is incorrect'); }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
});

// @desc    Set secret code (PIN)
// @route   PUT /api/auth/secret-code
// @access  Private
const setSecretCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!code || code.length < 4) { res.status(400); throw new Error('Secret code must be at least 4 characters'); }

    const salt = await bcrypt.genSalt(10);
    user.secretCode = await bcrypt.hash(code, salt);
    user.secretCodeLength = code.length;
    await user.save();

    res.json({ message: 'Secret code set successfully' });
});

// @desc    Reset secret code (PIN)
// @route   PUT /api/auth/reset-secret-code
// @access  Private
const resetSecretCode = asyncHandler(async (req, res) => {
    const { oldCode, newCode } = req.body;
    logDebug(`resetSecretCode called: body=${JSON.stringify(req.body)}, user=${req.user ? req.user.email : 'null'}`);
    const user = await User.findById(req.user._id);

    if (!user) { 
        logDebug(`resetSecretCode failed: User not found`);
        res.status(404); 
        throw new Error('User not found'); 
    }
    if (!user.secretCode) { 
        logDebug(`resetSecretCode failed: Secret code not set`);
        res.status(400); 
        throw new Error('Secret code not set'); 
    }
    if (!oldCode || !newCode || newCode.length < 4) { 
        logDebug(`resetSecretCode failed: Invalid parameters (oldCode=${oldCode}, newCode=${newCode})`);
        res.status(400); 
        throw new Error('Please provide valid old and new code'); 
    }
    if (oldCode === newCode) { 
        logDebug(`resetSecretCode failed: New same as old`);
        res.status(400); 
        throw new Error('New passcode cannot be the same as the old passcode'); 
    }

    const isMatch = await bcrypt.compare(oldCode, user.secretCode);
    logDebug(`resetSecretCode isMatch: ${isMatch}`);
    if (!isMatch) { 
        logDebug(`resetSecretCode failed: Old code is incorrect`);
        res.status(401); 
        throw new Error('Old secret code is incorrect'); 
    }

    const salt = await bcrypt.genSalt(10);
    user.secretCode = await bcrypt.hash(newCode, salt);
    user.secretCodeLength = newCode.length;
    await user.save();

    logDebug(`resetSecretCode success!`);
    res.json({ message: 'Secret code reset successfully' });
});

// @desc    Verify secret code (PIN)
// @route   POST /api/auth/verify-secret-code
// @access  Private
const verifySecretCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!user.secretCode) { res.status(400); throw new Error('Secret code not set'); }

    const isMatch = await bcrypt.compare(code, user.secretCode);
    if (!isMatch) { res.status(401); throw new Error('Invalid secret code'); }

    res.json({ success: true, message: 'Secret code verified' });
});

// @desc    Set App Lock code (PIN)
// @route   PUT /api/auth/app-lock-code
// @access  Private
const setAppLockCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!code || code.length < 4) { res.status(400); throw new Error('App lock code must be at least 4 characters'); }

    const salt = await bcrypt.genSalt(10);
    user.appLockCode = await bcrypt.hash(code, salt);
    user.appLockCodeLength = code.length;
    await user.save();

    res.json({ message: 'App lock code set successfully' });
});

// @desc    Reset App Lock code (PIN)
// @route   PUT /api/auth/reset-app-lock-code
// @access  Private
const resetAppLockCode = asyncHandler(async (req, res) => {
    const { oldCode, newCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!user.appLockCode) { res.status(400); throw new Error('App lock code not set'); }
    if (!oldCode || !newCode || newCode.length < 4) { res.status(400); throw new Error('Please provide valid old and new code'); }
    if (oldCode === newCode) { res.status(400); throw new Error('New passcode cannot be the same as the old passcode'); }

    const isMatch = await bcrypt.compare(oldCode, user.appLockCode);
    if (!isMatch) { res.status(401); throw new Error('Old app lock code is incorrect'); }

    const salt = await bcrypt.genSalt(10);
    user.appLockCode = await bcrypt.hash(newCode, salt);
    user.appLockCodeLength = newCode.length;
    await user.save();

    res.json({ message: 'App lock code reset successfully' });
});

// @desc    Verify App Lock code (PIN)
// @route   POST /api/auth/verify-app-lock-code
// @access  Private
const verifyAppLockCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!user.appLockCode) { res.status(400); throw new Error('App lock code not set'); }

    const isMatch = await bcrypt.compare(code, user.appLockCode);
    if (!isMatch) { res.status(401); throw new Error('Invalid app lock code'); }

    res.json({ success: true, message: 'App lock code verified' });
});

// @desc    Disable App Lock code
// @route   PUT /api/auth/disable-app-lock-code
// @access  Private
const disableAppLockCode = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) { res.status(404); throw new Error('User not found'); }
    user.appLockCode = '';
    user.appLockCodeLength = 0;
    await user.save();

    res.json({ message: 'App lock disabled successfully' });
});

// @desc    Update push token
// @route   PUT /api/auth/push-token
// @access  Private
const updatePushToken = asyncHandler(async (req, res) => {
    const { expoPushToken } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.expoPushToken = expoPushToken || '';
    await user.save();

    res.json({ success: true, message: 'Push token updated successfully' });
});

// @desc    Update public key
// @route   PUT /api/auth/public-key
// @access  Private
const updatePublicKey = asyncHandler(async (req, res) => {
    const { publicKey } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.publicKey = publicKey || '';
    await user.save();

    res.json({ success: true, message: 'Public key updated successfully' });
});

// @desc    Block a user
// @route   POST /api/auth/block
// @access  Private
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.blockedUsers) {
        currentUser.blockedUsers = [];
    }

    if (!currentUser.blockedUsers.includes(userId)) {
        currentUser.blockedUsers.push(userId);
        await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'User blocked successfully', userId });
});

// @desc    Unblock a user
// @route   POST /api/auth/unblock
// @access  Private
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (currentUser.blockedUsers) {
        currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userId);
        await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'User unblocked successfully', userId });
});

// @desc    Mute notifications for a user
// @route   POST /api/auth/mute
// @access  Private
const muteUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.mutedUsers) {
        currentUser.mutedUsers = [];
    }

    if (!currentUser.mutedUsers.includes(userId)) {
        currentUser.mutedUsers.push(userId);
        await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'User notifications muted successfully', userId });
});

// @desc    Unmute notifications for a user
// @route   POST /api/auth/unmute
// @access  Private
const unmuteUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (currentUser.mutedUsers) {
        currentUser.mutedUsers = currentUser.mutedUsers.filter(id => id.toString() !== userId);
        await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'User notifications unmuted successfully', userId });
});

// @desc    Report a user (and automatically block them)
// @route   POST /api/auth/report
// @access  Private
const reportUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const userToReport = await User.findById(userId);

    if (!userToReport) {
        res.status(404);
        throw new Error('User not found');
    }

    userToReport.reportCount = (userToReport.reportCount || 0) + 1;
    await userToReport.save();

    const currentUser = await User.findById(req.user._id);
    if (!currentUser.blockedUsers) {
        currentUser.blockedUsers = [];
    }

    if (!currentUser.blockedUsers.includes(userId)) {
        currentUser.blockedUsers.push(userId);
        await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'User reported and blocked successfully', userId });
});

module.exports = {
    registerUser,
    loginUser,
    getUsers,
    getUserById,
    getMe,
    updateProfile,
    changePassword,
    setSecretCode,
    verifySecretCode,
    resetSecretCode,
    setAppLockCode,
    verifyAppLockCode,
    resetAppLockCode,
    disableAppLockCode,
    updatePushToken,
    updatePublicKey,
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    reportUser
};
