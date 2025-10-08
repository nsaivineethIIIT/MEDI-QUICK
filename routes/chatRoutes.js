const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.postSend);
router.get('/:appointmentId', chatController.getChat);

module.exports = router;