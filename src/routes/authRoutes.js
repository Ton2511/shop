const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ลบรูปแบบซ้ำซ้อน - เหลือแค่หนึ่งเส้นทางสำหรับ login และ logout
router.get("/login", authController.getLoginPage);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

module.exports = router;