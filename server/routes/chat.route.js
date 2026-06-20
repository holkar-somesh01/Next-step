const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage, editMessage, deleteMessage, clearChatHistory, markAsRead } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:receiverId', protect, getChatHistory);
router.post('/', protect, sendMessage);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);
router.delete('/clear/:receiverId', protect, clearChatHistory);
router.put('/read/:senderId', protect, markAsRead);

module.exports = router;
