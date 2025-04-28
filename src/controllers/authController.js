// controllers/authController.js
const { User } = require('../models');

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

exports.postLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log(`Attempting login for email: ${email}`); // เพิ่ม log
      
      // ค้นหาผู้ใช้ด้วย email
      const user = await User.findOne({ where: { email } });
      
      console.log(`User found: ${user ? 'Yes' : 'No'}`); // เพิ่ม log
      
      // ตรวจสอบว่าพบผู้ใช้หรือไม่ และรหัสผ่านถูกต้องหรือไม่
      if (!user) {
        console.log(`User not found for email: ${email}`); // เพิ่ม log
        return res.send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
      }
      
      const isPasswordValid = await user.comparePassword(password);
      console.log(`Password valid: ${isPasswordValid ? 'Yes' : 'No'}`); // เพิ่ม log
      
      if (!isPasswordValid) {
        return res.send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
      }
      
      // เก็บข้อมูลผู้ใช้ใน session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      
      console.log('Session created:', req.session.user); // เพิ่ม log
      
      res.redirect("/");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
      res.send(`เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error.message}`); // เพิ่มรายละเอียดข้อผิดพลาด
    }
  };

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};