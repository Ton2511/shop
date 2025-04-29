// scripts/test-connection.js
require('dotenv').config();
const { sequelize, connectDB } = require('../db');
const { User } = require('../src/models');
const SequelizeStore = require('connect-session-sequelize')(require('express-session').Store);

// สร้าง session store ด้วย Sequelize สำหรับทดสอบ
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions'
});

const testConnection = async () => {
  try {
    console.log('==== Testing Database Connection ====');
    
    // ทดสอบการเชื่อมต่อฐานข้อมูล
    await connectDB();
    console.log('✅ Database connection successful');
    
    // ทดสอบการดึงข้อมูลผู้ใช้
    const usersCount = await User.count();
    console.log(`✅ Found ${usersCount} users in database`);
    
    // ทดสอบการสร้างตาราง session
    await sessionStore.sync();
    console.log('✅ Session table synchronized');
    
    // ทดสอบการบันทึก session (จำลอง)
    const sessionModel = sessionStore.sessionModel;
    const testSessionId = 'test-session-' + Date.now();
    
    // ลองบันทึก session
    await sessionModel.create({
      sid: testSessionId,
      expires: new Date(Date.now() + 3600000),
      data: JSON.stringify({
        cookie: { originalMaxAge: 3600000 },
        user: { id: 0, name: 'Test User', email: 'test@example.com' }
      })
    });
    console.log('✅ Test session created');
    
    // ลองดึง session
    const savedSession = await sessionModel.findOne({ where: { sid: testSessionId } });
    if (savedSession) {
      console.log('✅ Test session retrieved successfully');
      
      // ลบ session ทดสอบ
      await savedSession.destroy();
      console.log('✅ Test session deleted');
    } else {
      console.log('❌ Failed to retrieve test session');
    }
    
    console.log('\n✅ All tests completed successfully');
    console.log('==== Database and Session Configuration is Working Correctly ====');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // ปิดการเชื่อมต่อ
    await sequelize.close();
    process.exit(0);
  }
};

// เรียกใช้ฟังก์ชัน
testConnection();