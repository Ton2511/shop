require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const fs = require('fs');

const { sequelize, connectDB } = require("./db");
const { sessionMiddleware, initSessionStore } = require("./src/config/sessionConfig");
const { Category } = require("./src/models");
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// เริ่มแอพพลิเคชัน Express
const app = express();

// ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride("_method"));

// ตั้งค่า Static Files
app.use(express.static(path.join(__dirname, "public")));

// ตั้งค่า Session
app.use(sessionMiddleware);

// Request Logger Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${req.method} ${req.url} - ${req.ip}\n`;
  
  // Log to console in development
  console.log(log.trim());
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'requests.log'), log);
  
  next();
});

// กำหนดตัวแปร Global
app.use((req, res, next) => {
  res.locals.session = req.session;
  
  // Debug: แสดงข้อมูล session
  console.log('Current session state:', 
    req.session ? 
    (req.session.user ? `User logged in: ${req.session.user.email}` : 'No user in session') : 
    'No session'
  );
  
  next();
});

// Middleware ตรวจสอบการล็อกอิน
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    console.log('Authentication required, redirecting to login');
    return res.redirect("/login");
  }
  console.log('Authentication successful, user:', req.session.user.email);
  next();
};

// เตรียมข้อมูลหมวดหมู่สำหรับทุกหน้า
app.use(async (req, res, next) => {
  try {
    res.locals.categories = await Category.findAll();
  } catch (error) {
    console.error('Error fetching categories:', error);
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
app.use("/users", requireAuth, userRoutes);
app.use("/categories", requireAuth, categoryRoutes);
app.use("/products", productRoutes); // productRoutes should enforce auth internally where needed
app.use("/shop", shopRoutes);

// Add a health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = sequelize.authenticate()
    .then(() => 'connected')
    .catch(() => 'disconnected');
  
  Promise.resolve(dbStatus)
    .then(status => {
      res.json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        database: status,
        environment: process.env.NODE_ENV || 'development',
        memory: process.memoryUsage()
      });
    });
});

// Add test login route for diagnostics
app.get('/test-login', (req, res) => {
  res.render('auth/test-login', {
    title: 'Login Test',
    layout: 'layouts/main'
  });
});

app.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = require('./src/models/User');
    
    // Try to find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.send(`
        <h1>Login Test Results</h1>
        <p style="color: red;">User not found for email: ${email}</p>
        <a href="/test-login">Try again</a>
      `);
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.send(`
        <h1>Login Test Results</h1>
        <p style="color: red;">Password incorrect for user: ${email}</p>
        <a href="/test-login">Try again</a>
      `);
    }
    
    // Create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    
    // Save session explicitly
    req.session.save(err => {
      if (err) {
        return res.send(`
          <h1>Login Test Results</h1>
          <p style="color: red;">Session save error: ${err.message}</p>
          <pre>${err.stack}</pre>
          <a href="/test-login">Try again</a>
        `);
      }
      
      res.send(`
        <h1>Login Test Results</h1>
        <p style="color: green;">Login successful!</p>
        <p>User: ${user.name} (${user.email})</p>
        <p>Session created successfully</p>
        <a href="/">Go to homepage</a>
      `);
    });
  } catch (error) {
    res.send(`
      <h1>Login Test Results</h1>
      <p style="color: red;">Error: ${error.message}</p>
      <pre>${error.stack}</pre>
      <a href="/test-login">Try again</a>
    `);
  }
});

// จัดการเส้นทางที่ไม่พบ - must be after all routes
app.use(notFoundHandler);

// Error Handler - must be last
app.use(errorHandler);

// เริ่มเซิร์ฟเวอร์และซิงค์ฐานข้อมูล
const PORT = process.env.PORT || 5000;

// ฟังก์ชันสำหรับเริ่มแอปพลิเคชัน
const startApp = async () => {
  try {
    // เชื่อมต่อฐานข้อมูล
    await connectDB();
    console.log('✅ Database connection established');
    
    // ซิงค์โมเดลทั้งหมดกับฐานข้อมูล (สร้างตารางถ้ายังไม่มี)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
    
    // เตรียม session store
    await initSessionStore();
    console.log('✅ Session store initialized');
    
    // เริ่มเซิร์ฟเวอร์
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Log files stored in: ${logsDir}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    
    // Log to startup error file
    fs.writeFileSync(
      path.join(logsDir, 'startup-error.log'), 
      `${new Date().toISOString()}\n${error.stack || error.message}\n`
    );
    
    process.exit(1);
  }
};

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  fs.appendFileSync(
    path.join(logsDir, 'uncaught-exceptions.log'),
    `${new Date().toISOString()}\n${err.stack || err.message}\n\n`
  );
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  fs.appendFileSync(
    path.join(logsDir, 'unhandled-rejections.log'),
    `${new Date().toISOString()}\n${reason.stack || reason}\n\n`
  );
});

// เรียกใช้ฟังก์ชันเริ่มแอปพลิเคชัน
startApp();