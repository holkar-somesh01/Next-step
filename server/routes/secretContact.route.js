const express = require('express');
const router = express.Router();
const { addSecretContact, getSecretContacts, updateSecretContact, deleteSecretContact } = require('../controllers/secretContact.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
    .get(protect, getSecretContacts)
    .post(protect, addSecretContact);

router.route('/:id')
    .put(protect, updateSecretContact)
    .delete(protect, deleteSecretContact);

module.exports = router;
