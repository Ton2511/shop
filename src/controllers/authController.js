// controllers/authController.js
const { User } = require('../models');

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // ค้นหาผู้ใช้ด้วย email
        const user = await User.findOne({ where: { email } });
        
        // ตรวจสอบว่าพบผู้ใช้หรือไม่ และรหัสผ่านถูกต้องหรือไม่
        if (!user || !(await user.comparePassword(password))) {
            return res.send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
        }
        
        // เก็บข้อมูลผู้ใช้ใน session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        res.redirect("/");
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
        res.send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};