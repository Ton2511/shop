const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// หน้าแรก
router.get('/', mainController.getHomePage);

router.get('/about-us', (req, res) => {
    res.render('about'); // หรือใช้ res.send('About Us Page');
  });

module.exports = router;