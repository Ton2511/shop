// db.js - ไฟล์เชื่อมต่อฐานข้อมูล SQL
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
      max: 10,         // เพิ่มจำนวน connections สูงสุด
      min: 2,          // รักษา connections ขั้นต่ำไว้เสมอ
      acquire: 60000,  // เพิ่มเวลาในการรอ connection ก่อน timeout
      idle: 20000      // เพิ่มเวลาที่ connection ไม่ได้ใช้งานก่อนถูกปิด
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

module.exports = { sequelize, connectDB, pingDatabase };