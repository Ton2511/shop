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
    logging: false, // เปลี่ยนเป็น false ในโหมด production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQL Database Connected...");
  } catch (err) {
    console.error("❌ SQL Database Connection Error:", err);
    throw err; // ส่งต่อข้อผิดพลาดเพื่อให้จัดการในชั้นบน
  }
};

module.exports = { sequelize, connectDB };