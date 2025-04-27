// สคริปต์สร้างผู้ใช้ admin เริ่มต้น
require('dotenv').config();
const { sequelize } = require('../db');
const { User } = require('../src/models');

const createAdminUser = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await sequelize.authenticate();
    console.log('✅ เชื่อมต่อกับฐานข้อมูลสำเร็จ');
    
    // ตรวจสอบว่ามีตารางหรือยัง ถ้าไม่มีให้สร้าง
    await sequelize.sync();
    
    // สร้างผู้ใช้ admin
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@gmail.com' },
      defaults: {
        name: 'admin',
        password: '11111111'
      }
    });
    
    if (created) {
      console.log('✅ สร้างผู้ใช้ admin เรียบร้อยแล้ว');
    } else {
      console.log('ℹ️ ผู้ใช้ admin มีอยู่แล้ว กำลังอัปเดตรหัสผ่าน');
      await user.update({ password: '11111111' });
      console.log('✅ อัปเดตรหัสผ่านเรียบร้อยแล้ว');
    }
    
    console.log('\nข้อมูลเข้าสู่ระบบ:');
    console.log('--------------------');
    console.log('อีเมล: admin@gmail.com');
    console.log('รหัสผ่าน: 11111111');
    console.log('--------------------');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ
    await sequelize.close();
    process.exit(0);
  }
};

// เรียกใช้ฟังก์ชัน
createAdminUser();