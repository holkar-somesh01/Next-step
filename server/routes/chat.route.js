const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage, editMessage, deleteMessage } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:receiverId', protect, getChatHistory);
router.post('/', protect, sendMessage);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
