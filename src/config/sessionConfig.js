// config/sessionConfig.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../../db');

// สร้าง session store ด้วย Sequelize
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  expiration: 1000 * 60 * 60, // 1 ชั่วโมง
  checkExpirationInterval: 15 * 60 * 1000 // ตรวจสอบการหมดอายุทุก 15 นาที
});

// ฟังก์ชันสำหรับสร้างตารางเซสชัน (ถ้ายังไม่มี)
const initSessionStore = async () => {
  await sessionStore.sync();
  console.log('Session store initialized');
};

// ตั้งค่า middleware สำหรับ session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'myshopsecret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    maxAge: 1000 * 60 * 60, // 1 ชั่วโมง
    secure: false, // เปลี่ยนเป็น false เพื่อทดสอบก่อน
    httpOnly: true,
    sameSite: 'lax' // เพิ่มตัวเลือกนี้เพื่อความเข้ากันได้กับบราวเซอร์สมัยใหม่
  }
});

module.exports = { sessionMiddleware, initSessionStore };