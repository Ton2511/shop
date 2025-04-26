// controllers/userController.js
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// แสดงรายการผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.render("users/list", { 
      title: "รายชื่อผู้ใช้", 
      users, 
      content: "users/list" 
    });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).send("Internal Server Error");
  }
};

// แสดงฟอร์มเพิ่มผู้ใช้
exports.newUserForm = (req, res) => {
  res.render("users/new");
};

// สร้างผู้ใช้ใหม่
exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // สร้างผู้ใช้ใหม่ (รหัสผ่านจะถูกเข้ารหัสโดยอัตโนมัติผ่าน hooks)
    await User.create({ name, email, password });
    
    res.redirect("/users/list");
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).send("Internal Server Error");
  }
};

// แสดงฟอร์มแก้ไขผู้ใช้
exports.editUserForm = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.redirect("/users/list");
    }
    
    res.render("users/edit", { user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).send("Internal Server Error");
  }
};

// อัพเดทข้อมูลผู้ใช้
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.redirect("/users/list");
    }
    
    // เตรียมข้อมูลที่จะอัพเดท
    const updateData = { name, email };
    
    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password) {
      updateData.password = password; // จะถูกเข้ารหัสโดยอัตโนมัติผ่าน hooks
    }
    
    // อัพเดทข้อมูล
    await user.update(updateData);
    
    res.redirect("/users/list");
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).send("Internal Server Error");
  }
};

// ลบผู้ใช้
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (user) {
      await user.destroy();
    }
    
    res.redirect("/users/list");
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).send("Internal Server Error");
  }
};