// controllers/authController.js
const { User } = require('../models');

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        // Check if user exists and password is correct
        if (!user || !(await user.comparePassword(password))) {
            return res.send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
        }
        
        // Save user data in session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        // Save session explicitly before redirecting
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
            }
            res.redirect("/");
        });
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