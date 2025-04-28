// config/sessionConfig.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../../db');

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  expiration: 1000 * 60 * 60, // 1 ชั่วโมง
  checkExpirationInterval: 15 * 60 * 1000, // ตรวจสอบการหมดอายุทุก 15 นาที
  logging: true // เพิ่ม logging
});

// ฟังก์ชันสำหรับสร้างตารางเซสชั่น (ถ้ายังไม่มี)
const initSessionStore = async () => {
  try {
    await sessionStore.sync();
    console.log('Session store initialized successfully');
  } catch (error) {
    console.error('Error initializing session store:', error);
  }
};

// ตั้งค่า middleware สำหรับ session
// ตั้งค่า middleware สำหรับ session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'myshopsecret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    maxAge: 1000 * 60 * 60, // 1 ชั่วโมง
    secure: process.env.NODE_ENV === 'production'
  },
  name: 'shop.sid'
});

// เพิ่ม log เพื่อตรวจสอบ session
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

module.exports = { sessionMiddleware, initSessionStore };