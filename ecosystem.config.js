// ecosystem.config.js - คอนฟิกสำหรับ PM2 Process Manager
module.exports = {
  apps: [{
    name: "rpcint_nodejs",
    script: "server.js",
    instances: "1",                // จำนวน instances ที่จะรัน (ควรเป็น 1 สำหรับ Plesk)
    exec_mode: "fork",             // fork mode เหมาะกับ Plesk
    watch: false,                  // ไม่ต้อง restart อัตโนมัติเมื่อไฟล์เปลี่ยน
    max_memory_restart: "500M",    // restart เมื่อใช้หน่วยความจำเกิน 500MB
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
    restart_delay: 5000,           // รอ 5 วินาทีก่อน restart
    max_restarts: 5,               // จำนวนครั้งสูงสุดที่จะ restart ใน 1 วัน
    stop_exit_codes: [0],          // รหัส exit ที่จะไม่ทำการ restart
    exp_backoff_restart_delay: 500, // เพิ่มเวลารอแบบ exponential

    // การติดตามทรัพยากร
    kill_timeout: 10000,           // เวลารอก่อนที่จะบังคับปิด process (10 วินาที)
    wait_ready: true,              // รอให้แอปส่งสัญญาณ "ready" ก่อนพิจารณาว่าเริ่มทำงานสำเร็จ
    listen_timeout: 30000,         // เวลาที่รอให้แอปส่งสัญญาณ "ready" (ms)
    
    // ควบคุมการ Restart
    min_uptime: "30s",             // แอพต้องทำงานอย่างน้อย 30 วินาทีจึงจะถือว่าเริ่มต้นสำเร็จ
    max_restarts_per_day: 16,      // จำกัดจำนวนการรีสตาร์ทต่อวัน (ป้องกัน restart loop)
    
    // การจัดการไฟล์ล็อก
    log_type: "json",              // บันทึกล็อกเป็นรูปแบบ JSON ทำให้วิเคราะห์ง่ายขึ้น
    
    // ส่วนเพิ่มเติมสำหรับ Node.js
    node_args: "--max-old-space-size=512 --expose-gc --max-http-header-size=16384"
  }]
};