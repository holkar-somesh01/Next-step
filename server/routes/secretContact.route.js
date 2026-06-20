const express = require('express');
const router = express.Router();
const { addSecretContact, getSecretContacts, deleteSecretContact } = require('../controllers/secretContact.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
    .get(protect, getSecretContacts)
    .post(protect, addSecretContact);

router.route('/:id')
    .delete(protect, deleteSecretContact);

module.exports = router;
