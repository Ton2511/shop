const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// 📌 GET: แสดง Users ทั้งหมด
router.get("/", userController.getAllUsers);

// 📌 GET: ฟอร์มเพิ่ม User
router.get("/new", userController.newUserForm);

// 📌 POST: เพิ่ม User
router.post("/", userController.createUser);

// 📌 GET: ฟอร์มแก้ไข User
router.get("/:id/edit", userController.editUserForm);

// 📌 PUT: อัปเดต User
router.put("/:id", userController.updateUser);

// 📌 DELETE: ลบ User
router.delete("/:id", userController.deleteUser);

module.exports = router;
