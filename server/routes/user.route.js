const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { registerUser, loginUser, getUsers, getUserById, getMe, updateProfile, changePassword, setSecretCode, verifySecretCode, resetSecretCode, setAppLockCode, verifyAppLockCode, resetAppLockCode, disableAppLockCode, updatePushToken, blockUser, unblockUser, muteUser, unmuteUser, reportUser } = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Multer config for profile images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `profile_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, admin, getUsers);
router.get('/user/:id', protect, getUserById);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/secret-code', protect, setSecretCode);
router.put('/reset-secret-code', protect, resetSecretCode);
router.post('/verify-secret-code', protect, verifySecretCode);
router.put('/app-lock-code', protect, setAppLockCode);
router.put('/reset-app-lock-code', protect, resetAppLockCode);
router.post('/verify-app-lock-code', protect, verifyAppLockCode);
router.put('/disable-app-lock-code', protect, disableAppLockCode);
router.put('/push-token', protect, updatePushToken);

router.post('/block', protect, blockUser);
router.post('/unblock', protect, unblockUser);
router.post('/mute', protect, muteUser);
router.post('/unmute', protect, unmuteUser);
router.post('/report', protect, reportUser);

module.exports = router;
