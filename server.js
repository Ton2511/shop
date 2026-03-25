require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { sequelize, connectDB, pingDatabase, closeConnection, cleanupConnections } = require("./db");
const { Category } = require("./src/models");
const { authMiddleware } = require("./src/utils/jwtAuth");

// เริ่มแอพพลิเคชัน Express
const app = express();

// ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(methodOverride("_method"));
app.use(cookieParser()); // Cookie parser middleware
app.use(cors()); // Enable CORS

// ตั้งค่า timeout เพื่อป้องกันการค้างของการร้องขอ
app.use((req, res, next) => {
  // ตั้งค่า timeout สำหรับการร้องขอทั้งหมด (2 นาที)
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// ตั้งค่า Static Files
app.use(express.static(path.join(__dirname, "public")));

// กำหนดตัวแปร Global
app.use((req, res, next) => {
  // Check for auth token
  const token = req.cookies?.authToken;
  res.locals.isLoggedIn = !!token;
  next();
});

// Middleware ตรวจสอบการล็อกอิน
const requireAuth = authMiddleware;

// เตรียมข้อมูลหมวดหมู่สำหรับทุกหน้า
app.use(async (req, res, next) => {
  try {
    res.locals.categories = await Category.findAll();
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.locals.categories = [];
  }
  next();
});

// เชื่อมต่อ Routes
const mainRoutes = require('./src/routes/mainRoutes');
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");
const shopRoutes = require("./src/routes/shopRoutes");

// กำหนด Routes
app.use('/', mainRoutes);
app.use("/", authRoutes); // ให้ /login และ /logout ทำงานที่ root
app.use("/users", userRoutes);
app.use("/categories", requireAuth, categoryRoutes);
app.use("/products",requireAuth, productRoutes); // ลบ requireAuth ชั่วคราวเพื่อทดสอบ
app.use("/shop", shopRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryUsage: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong! Please try again later.';
  
  // HTML response for browser requests
  if (req.accepts('html')) {
    return res.status(statusCode).render('error', { 
      title: `Error ${statusCode}`,
      message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
  
  // JSON response for API requests
  res.status(statusCode).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// จัดการเส้นทางที่ไม่พบ
app.all("*", (req, res) => {
  res.redirect("/");
});

// เริ่มเซิร์ฟเวอร์และซิงค์ฐานข้อมูล
const PORT = process.env.PORT || 5000;

// ฟังก์ชันสำหรับเริ่มแอปพลิเคชัน
const startApp = async () => {
  try {
    // เชื่อมต่อฐานข้อมูล
    await connectDB();
    
    // ซิงค์โมเดลทั้งหมดกับฐานข้อมูล (สร้างตารางถ้ายังไม่มี)
    await sequelize.sync({ alter: false });
    console.log('✅ Database tables synchronized');
    
    // เริ่มเซิร์ฟเวอร์
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // ตั้งค่า timeout สำหรับ HTTP server
    server.timeout = 120000; // 2 นาที
    server.keepAliveTimeout = 65000; // 65 วินาที
    server.headersTimeout = 66000; // 66 วินาที (ต้องมากกว่า keepAliveTimeout)
    
    // ตั้ง interval ping ไปยังฐานข้อมูลเพื่อรักษาการเชื่อมต่อ
    const PING_INTERVAL = 5 * 60 * 1000; // 5 นาที
    const pingIntervalId = setInterval(async () => {
      const isConnected = await pingDatabase();
      if (!isConnected) {
        console.log('⚠️ Database connection lost. Attempting to reconnect...');
        await connectDB();
      }
    }, PING_INTERVAL);
    
    // ตั้ง interval สำหรับทำความสะอาดการเชื่อมต่อค้าง
    const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 นาที
    const cleanupIntervalId = setInterval(async () => {
      console.log('🧹 Running scheduled connection cleanup...');
      await cleanupConnections();
    }, CLEANUP_INTERVAL);
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`⚠️ ${signal} signal received. Closing server gracefully...`);
      
      // ยกเลิก interval ทั้งหมด
      clearInterval(pingIntervalId);
      clearInterval(cleanupIntervalId);
      
      // ปิด server ก่อน
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        try {
          // ปิด database connection
          await closeConnection();
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force close if graceful shutdown takes too long
      setTimeout(() => {
        console.error('❌ Forcefully shutting down after timeout...');
        process.exit(1);
      }, 30000); // 30 seconds timeout
    };
    
    // Handle graceful shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Process-level error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Application will shut down gracefully.');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Attempt to perform cleanup
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  // We don't exit here to allow the application to continue running but log the error
});

// Periodic garbage collection hint (if running with --expose-gc)
if (global.gc) {
  const GC_INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    const beforeMem = process.memoryUsage().heapUsed / 1024 / 1024;
    global.gc();
    const afterMem = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`🧹 Manual garbage collection: ${beforeMem.toFixed(2)} MB -> ${afterMem.toFixed(2)} MB (freed ${(beforeMem - afterMem).toFixed(2)} MB)`);
  }, GC_INTERVAL);
}

// เรียกใช้ฟังก์ชันเริ่มแอปพลิเคชัน
startApp();