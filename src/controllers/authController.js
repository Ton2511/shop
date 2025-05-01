// src/controllers/authController.js
const { User } = require('../models');
const { generateToken } = require('../utils/jwtAuth');

exports.getLoginPage = (req, res) => {
    // Check if user is already logged in (has valid token)
    if (req.cookies?.authToken) {
        return res.redirect('/');
    }
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
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Set token in cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict' // Prevent CSRF attacks
        });
        
        res.redirect("/");
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
        res.send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
};

exports.logout = (req, res) => {
    // Clear the auth token cookie
    res.clearCookie('authToken');
    res.redirect("/login");
};