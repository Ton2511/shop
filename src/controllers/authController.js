// controllers/authController.js
const { User } = require('../models');

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

// controllers/authController.js
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
        
        // ทำการบันทึกเซสชันอย่างชัดเจน
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
            }
            console.log("Session saved successfully:", req.session);
            res.redirect("/");
        });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
        res.send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect("/");
        }
        res.clearCookie('connect.sid'); // ล้างคุกกี้เซสชัน
        console.log("Session destroyed successfully");
        res.redirect("/login");
    });
};