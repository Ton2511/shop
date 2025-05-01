// ecosystem.config.js - คอนฟิกสำหรับ PM2 Process Manager
module.exports = {
    apps: [{
      name: "rpcint_nodejs",
      script: "server.js",
      instances: 1,                  // จำนวน instances ที่จะรัน (สามารถตั้งเป็น 0 เพื่อใช้ทุก core, หรือ -1)
      exec_mode: "fork",             // fork mode (หรือ "cluster" สำหรับการทำงานแบบ cluster)
      watch: false,                  // ไม่ต้อง restart อัตโนมัติเมื่อไฟล์เปลี่ยน
      max_memory_restart: "300M",    // restart เมื่อใช้หน่วยความจำเกิน 300MB
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
      
      // การจัดการกับข้อผิดพลาด
      autorestart: true,             // restart อัตโนมัติเมื่อแอปล่ม
      restart_delay: 4000,           // รอ 4 วินาทีก่อน restart
      max_restarts: 10,              // จำนวนครั้งสูงสุดที่จะ restart ใน 1 วัน
      stop_exit_codes: [0],          // รหัส exit ที่จะไม่ทำการ restart
      exp_backoff_restart_delay: 100, // เพิ่มเวลารอแบบ exponential
  
      // การติดตามทรัพยากร
      kill_timeout: 3000,            // เวลารอก่อนที่จะบังคับปิด process (ms)
      wait_ready: true,              // รอให้แอปส่งสัญญาณ "ready" ก่อนพิจารณาว่าเริ่มทำงานสำเร็จ
      listen_timeout: 30000,         // เวลาที่รอให้แอปส่งสัญญาณ "ready" (ms)
      
      // ส่วนเพิ่มเติมสำหรับ garbage collection
      node_args: "--expose-gc"       // เปิดใช้งาน manual garbage collection
    }]
  };