// app.js
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

// เริ่มแอพพลิเคชัน Express
const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log function for debugging Passenger issues
const logInfo = (message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${JSON.stringify(data)}\n`;
  
  // Log to console
  console.log(message, data);
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'startup.log'), logEntry);
};

logInfo('Application starting', { 
  nodeVersion: process.version,
  env: process.env.NODE_ENV || 'development',
  appRoot: __dirname
});

// ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(methodOverride("_method"));

// ตั้งค่า Static Files
app.use(express.static(path.join(__dirname, "public")));

// Set up a simple error page in case of database issues
app.use((req, res, next) => {
  if (!req.app.get('dbInitialized')) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Starting</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 50px; line-height: 1.6; text-align: center; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          h1 { color: #3498db; }
        </style>
        <meta http-equiv="refresh" content="5">
      </head>
      <body>
        <div class="container">
          <h1>Server is Starting</h1>
          <p>The application is initializing. Please wait a moment...</p>
          <p>This page will automatically refresh in 5 seconds.</p>
        </div>
      </body>
      </html>
    `);
  }
  next();
});

// Handle uncaught errors to prevent app crash
app.use((err, req, res, next) => {
  logInfo('Error in request', { error: err.message, stack: err.stack });
  
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server Error</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 50px; line-height: 1.6; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        h1 { color: #e74c3c; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Server Error</h1>
        <p>We're sorry, but something went wrong on our end.</p>
        <p>Our team has been notified and is working on fixing the issue.</p>
        <a href="/" style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Try Again</a>
      </div>
    </body>
    </html>
  `);
});

// Initialize the database and routes
async function initializeApp() {
  try {
    // Connect to database
    logInfo('Connecting to database...');
    await connectDB();
    logInfo('Database connected');
    
    // Initialize session store
    logInfo('Initializing session store...');
    await initSessionStore();
    logInfo('Session store initialized');
    
    // Mark database as initialized
    app.set('dbInitialized', true);
    
    // ตั้งค่า Session
    app.use(sessionMiddleware);
    
    // กำหนดตัวแปร Global
    app.use((req, res, next) => {
      res.locals.session = req.session;
      next();
    });
    
    // Middleware ตรวจสอบการล็อกอิน
    const requireAuth = (req, res, next) => {
      if (!req.session.user) {
        return res.redirect("/login");
      }
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
    app.use("/", authRoutes);
    app.use("/users", requireAuth, userRoutes);
    app.use("/categories", requireAuth, categoryRoutes);
    app.use("/products", productRoutes);
    app.use("/shop", shopRoutes);
    
    // Add a health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // จัดการเส้นทางที่ไม่พบ
    app.all("*", (req, res) => {
      res.redirect("/");
    });
    
    logInfo('Application initialized successfully');
    
  } catch (error) {
    logInfo('Failed to initialize application', { error: error.message, stack: error.stack });
    // Don't exit the process - let Passenger handle it
  }
}

// Initialize the app
initializeApp();

// Export the Express app for Passenger
module.exports = app;