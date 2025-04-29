// src/config/sessionConfig.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../../db');

// สร้าง session store ด้วย Sequelize
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  expiration: 24 * 60 * 60 * 1000, // 24 ชั่วโมง (เพิ่มเวลา)
  checkExpirationInterval: 15 * 60 * 1000 // ตรวจสอบการหมดอายุทุก 15 นาที
});

// ฟังก์ชันสำหรับสร้างตารางเซสชั่น (ถ้ายังไม่มี)
const initSessionStore = async () => {
  try {
    await sessionStore.sync();
    console.log('Session store initialized and synced');
  } catch (error) {
    console.error('Error syncing session store:', error);
  }
};

// ตั้งค่า middleware สำหรับ session
const sessionMiddleware = session({
  key: 'shop_session',  // เพิ่มคีย์เฉพาะสำหรับคุกกี้
  secret: process.env.SESSION_SECRET || 'myshopsecret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 ชั่วโมง (เพิ่มเวลา)
    secure: process.env.NODE_ENV === 'production', // เปิดใช้ secure ในโหมด production เท่านั้น
    httpOnly: true,
    sameSite: 'lax'  // ตั้งค่า sameSite เพื่อความปลอดภัย
  }
});

module.exports = { sessionMiddleware, initSessionStore };