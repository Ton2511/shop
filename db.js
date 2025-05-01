// db.js - ไฟล์เชื่อมต่อฐานข้อมูล SQL with improved connection handling
require('dotenv').config();
const { Sequelize } = require('sequelize');

// สร้าง Sequelize instance ที่ปรับปรุงการจัดการ connection
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,         // เพิ่มจำนวน connections สูงสุด (ปรับตามการใช้งานจริง)
      min: 5,          // รักษา connections ขั้นต่ำไว้เสมอ
      acquire: 60000,  // เพิ่มเวลาในการรอ connection ก่อน timeout
      idle: 30000,     // เพิ่มเวลาที่ connection ไม่ได้ใช้งานก่อนถูกปิด
      evict: 30000     // ตรวจสอบและกำจัดการเชื่อมต่อที่หมดอายุทุก 30 วินาที
    },
    retry: {
      max: 5, // จำนวนครั้งที่จะพยายามเชื่อมต่อใหม่
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      backoffBase: 1000, // เวลาพื้นฐาน (ms) ก่อนลองใหม่
      backoffExponent: 1.5, // ตัวคูณสำหรับเพิ่มเวลารอแบบ exponential
    },
    dialectOptions: {
      connectTimeout: 60000, // เวลาในการรอเชื่อมต่อกับ MySQL
      // ตั้งค่า keepAlive เพื่อป้องกันการตัดการเชื่อมต่อโดย firewall
      socketOptions: {
        keepAlive: true,
        keepAliveInitialDelay: 30000 // 30 วินาที
      }
    }
  }
);

// ฟังก์ชันสำหรับทดสอบการเชื่อมต่อพร้อมระบบ retry อัตโนมัติ
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("✅ SQL Database Connected Successfully");
      return;
    } catch (err) {
      retries -= 1;
      console.error(`❌ Database connection error (attempt ${5-retries}/5): ${err.message}`);
      if (!retries) {
        console.error("❌ Maximum connection retries reached. Exiting application...");
        process.exit(1);
      }
      
      // คำนวณเวลารอก่อนลองใหม่ (exponential backoff)
      const waitTime = Math.pow(1.5, 5-retries) * 1000;
      console.log(`Waiting ${waitTime/1000} seconds before trying again...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// เพิ่ม ping function เพื่อตรวจสอบการเชื่อมต่อเป็นระยะ
const pingDatabase = async () => {
  try {
    await sequelize.query('SELECT 1+1 AS result');
    return true;
  } catch (error) {
    console.error('Database ping failed:', error.message);
    return false;
  }
};

// เพิ่มฟังก์ชันสำหรับปิดการเชื่อมต่อเมื่อปิดแอป
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed gracefully');
    return true;
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
    return false;
  }
};

// แก้ไขปัญหาการเชื่อมต่อค้าง (zombie connections)
const cleanupConnections = async () => {
  try {
    // ดึงรายการเชื่อมต่อที่ค้างอยู่
    const [sleepConnections] = await sequelize.query(
      "SELECT id FROM information_schema.processlist WHERE command = 'Sleep' AND time > 30"
    );
    
    if (sleepConnections.length > 0) {
      console.log(`Found ${sleepConnections.length} zombie connections. Cleaning up...`);
      
      // ปิดการเชื่อมต่อที่ค้าง
      for (const conn of sleepConnections) {
        await sequelize.query(`KILL ${conn.id}`);
      }
      
      console.log(`Cleaned up ${sleepConnections.length} zombie connections.`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up connections:', error.message);
    return false;
  }
};

module.exports = { 
  sequelize, 
  connectDB, 
  pingDatabase, 
  closeConnection,
  cleanupConnections
};