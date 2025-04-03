const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// หน้าแรก
router.get('/', mainController.getHomePage);

module.exports = router;