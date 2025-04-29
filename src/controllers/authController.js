// controllers/authController.js
const { User } = require('../models');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper to log authentication events
const logAuthEvent = (type, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${type}: ${JSON.stringify(details)}\n`;
  
  // Log to console
  console.log(`Auth event: ${type}`, details);
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'auth.log'), logEntry);
};

exports.getLoginPage = (req, res) => {
    // Check if the user is already logged in
    if (req.session && req.session.user) {
        logAuthEvent('ALREADY_LOGGED_IN', { 
            userId: req.session.user.id,
            email: req.session.user.email
        });
        return res.redirect('/');
    }
    
    res.render("auth/login", {
        title: "Login",
        error: req.query.error
    });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        logAuthEvent('LOGIN_ATTEMPT', { email });
        
        // Validate input
        if (!email || !password) {
            logAuthEvent('LOGIN_ERROR', { email, error: 'Missing email or password' });
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email และรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง'
            });
        }
        
        // ค้นหาผู้ใช้ด้วย email
        const user = await User.findOne({ where: { email } });
        
        // ตรวจสอบว่าพบผู้ใช้หรือไม่
        if (!user) {
            logAuthEvent('LOGIN_ERROR', { email, error: 'User not found' });
            return res.render('auth/login', {
                title: 'Login',
                error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลของคุณ'
            });
        }
        
        // ตรวจสอบรหัสผ่าน
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logAuthEvent('LOGIN_ERROR', { email, error: 'Invalid password' });
            return res.render('auth/login', {
                title: 'Login',
                error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
            });
        }
        
        // เก็บข้อมูลผู้ใช้ใน session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        // บันทึก session
        req.session.save(err => {
            if (err) {
                logAuthEvent('SESSION_ERROR', { email, error: err.message });
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'เกิดข้อผิดพลาดในการสร้างเซสชัน กรุณาลองใหม่อีกครั้ง'
                });
            }
            
            logAuthEvent('LOGIN_SUCCESS', { userId: user.id, email: user.email });
            
            // ตรวจสอบการเรียกต่อจาก URL ที่ต้องการการยืนยันตัวตน
            const redirectTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            
            res.redirect(redirectTo);
        });
    } catch (error) {
        logAuthEvent('LOGIN_ERROR', { error: error.message, stack: error.stack });
        console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
        
        res.render('auth/login', {
            title: 'Login',
            error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งในภายหลัง'
        });
    }
};

exports.logout = (req, res) => {
    // ตรวจสอบว่ามี session หรือไม่
    if (req.session && req.session.user) {
        const { id, email } = req.session.user;
        
        // ลบ session
        req.session.destroy(err => {
            if (err) {
                logAuthEvent('LOGOUT_ERROR', { userId: id, email, error: err.message });
                console.error("Logout error:", err);
                return res.redirect('/');
            }
            
            logAuthEvent('LOGOUT_SUCCESS', { userId: id, email });
            
            // ล้าง cookie ของ session
            res.clearCookie('shop_session');
            res.redirect("/login");
        });
    } else {
        logAuthEvent('LOGOUT_ATTEMPT', { status: 'No active session' });
        res.redirect("/login");
    }
};