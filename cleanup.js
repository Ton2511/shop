// cleanup.js - สคริปต์สำหรับทำความสะอาดไฟล์ชั่วคราวและรีเซ็ตฐานข้อมูลหากจำเป็น
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./db');

async function cleanupTempFiles() {
  // รายการโฟลเดอร์ที่ต้องการเคลียร์ไฟล์ชั่วคราว
  const tempFolders = [
    path.join(__dirname, 'tmp'),
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'public/uploads/temp')
  ];

  // ตรวจสอบและสร้างโฟลเดอร์หากยังไม่มี
  tempFolders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  });

  // ลบไฟล์ชั่วคราวที่เก่ากว่า X วัน
  const MAX_AGE_DAYS = 7;
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000; // แปลงเป็นมิลลิวินาที

  let totalRemoved = 0;

  for (const folder of tempFolders) {
    if (!fs.existsSync(folder)) continue;

    const files = fs.readdirSync(folder);
    
    for (const file of files) {
      if (file === '.gitkeep') continue; // ข้ามไฟล์ .gitkeep
      
      const filePath = path.join(folder, file);
      const fileStat = fs.statSync(filePath);
      
      // ตรวจสอบว่าเป็นไฟล์ (ไม่ใช่โฟลเดอร์) และเก่าเกินกำหนด
      if (fileStat.isFile() && (now - fileStat.mtime.getTime() > maxAge)) {
        fs.unlinkSync(filePath);
        totalRemoved++;
        console.log(`Removed old file: ${filePath}`);
      }
    }
  }

  console.log(`Cleanup complete. Removed ${totalRemoved} temporary files.`);
}

async function checkDatabaseConnections() {
  try {
    console.log('Checking database connections...');
    
    // ดึงข้อมูลเกี่ยวกับการเชื่อมต่อปัจจุบัน
    const [results] = await sequelize.query('SHOW PROCESSLIST');
    
    console.log(`Found ${results.length} active database connections`);
    
    // แสดงจำนวนการเชื่อมต่อแบ่งตามสถานะ
    const connectionStates = {};
    results.forEach(conn => {
      const state = conn.State || 'null';
      connectionStates[state] = (connectionStates[state] || 0) + 1;
    });
    
    console.log('Connection states:');
    Object.entries(connectionStates).forEach(([state, count]) => {
      console.log(`- ${state}: ${count}`);
    });
    
    // คำนวณสถิติ
    const sleepConnections = results.filter(conn => conn.State === 'Sleep').length;
    const longRunningConnections = results.filter(conn => conn.Time > 60).length;
    
    console.log(`Sleep connections: ${sleepConnections}`);
    console.log(`Long-running connections (>60s): ${longRunningConnections}`);
    
    // ถ้าจำเป็น สามารถปิดการเชื่อมต่อที่ไม่ได้ใช้งาน
    if (process.argv.includes('--kill-sleep') && sleepConnections > 10) {
      console.log('Killing sleep connections...');
      for (const conn of results) {
        if (conn.State === 'Sleep' && conn.Id) {
          await sequelize.query(`KILL ${conn.Id}`);
          console.log(`Killed connection ID: ${conn.Id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking database connections:', error);
  }
}

// ฟังก์ชันหลัก
async function main() {
  try {
    // ดำเนินการเคลียร์ไฟล์ชั่วคราว
    await cleanupTempFiles();
    
    // ตรวจสอบการเชื่อมต่อฐานข้อมูล
    await checkDatabaseConnections();
    
    console.log('All cleanup tasks completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// เรียกใช้ฟังก์ชันหลัก
main();