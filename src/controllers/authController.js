// controllers/authController.js
const { User } = require('../models');

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`Login attempt for email: ${email}`);
        
        // ค้นหาผู้ใช้ด้วย email
        const user = await User.findOne({ where: { email } });
        
        // ตรวจสอบว่าพบผู้ใช้หรือไม่
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.status(401).send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
        }
        
        // ตรวจสอบรหัสผ่าน
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            console.log(`Invalid password for user: ${email}`);
            return res.status(401).send("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
        }
        
        // เก็บข้อมูลผู้ใช้ใน session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        // บันทึก session ให้เสร็จสมบูรณ์ก่อนที่จะ redirect
        req.session.save(err => {
            if (err) {
                console.error("Error saving session:", err);
                return res.status(500).send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
            }
            
            console.log(`Login successful for user: ${email}`);
            res.redirect("/");
        });
    } catch (error) {
        console.error("Error in login process:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
};

exports.logout = (req, res) => {
    // ตรวจสอบว่ามี session หรือไม่
    if (req.session) {
        // ลบ session
        req.session.destroy(err => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("เกิดข้อผิดพลาดในการออกจากระบบ");
            }
            
            // ล้างคุกกี้
            res.clearCookie('shop_session');
            res.redirect("/login");
        });
    } else {
        res.redirect("/login");
    }
};