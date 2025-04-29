// // db.js - ไฟล์เชื่อมต่อฐานข้อมูล SQL
// const { Sequelize } = require('sequelize');

// // สร้าง Sequelize instance
// const sequelize = new Sequelize(
//   process.env.DB_NAME || 'shop_db', 
//   process.env.DB_USER || 'root', 
//   process.env.DB_PASSWORD || '', 
//   {
//     host: process.env.DB_HOST || 'localhost',
//     dialect: 'mysql',
//     logging: console.log,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   }
// );

// // ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ
// const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ SQL Database Connected...");
//   } catch (err) {
//     console.error("❌ SQL Database Connection Error:", err);
//     process.exit(1);
//   }
// };

// module.exports = { sequelize, connectDB };

// db.js - ไฟล์เชื่อมต่อฐานข้อมูล SQL
const { Sequelize } = require('sequelize');

// สร้าง Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'rpcint_nodejs', 
  process.env.DB_USER || 'rpcint_admin', 
  process.env.DB_PASSWORD || 'Arinkkn@517', 
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: (process.env.NODE_ENV === 'production') ? false : console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    // เพิ่มตัวเลือกสำหรับการเชื่อมต่อที่เสถียรมากขึ้น
    dialectOptions: {
      connectTimeout: 60000,
      // แก้ไขปัญหา SSL (สำหรับบางโฮสต์)
      ssl: process.env.NODE_ENV === 'production' ? {
        require: false,
        rejectUnauthorized: false
      } : false,
      // เพิ่มการรองรับ timezone
      timezone: '+07:00' // เวลาประเทศไทย
    },
    // ตั้งค่า timezone
    timezone: '+07:00'
  }
);

// ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQL Database Connected...");
    return true;
  } catch (err) {
    console.error("❌ SQL Database Connection Error:", err);
    
    // พยายามเชื่อมต่ออีกครั้งหลังจาก 5 วินาที
    console.log("Retrying connection in 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await sequelize.authenticate();
      console.log("✅ SQL Database Connected on retry...");
      return true;
    } catch (retryErr) {
      console.error("❌ SQL Database Connection Error on retry:", retryErr);
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };