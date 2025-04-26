require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const { sequelize, connectDB } = require("./db");
const { sessionMiddleware, initSessionStore } = require("./src/config/sessionConfig");
const { Category } = require("./src/models");

// เริ่มแอพพลิเคชัน Express
const app = express();

// ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// ตั้งค่า Static Files
app.use(express.static(path.join(__dirname, "public")));

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
app.use("/products", productRoutes); // ลบ requireAuth ชั่วคราวเพื่อทดสอบ
app.use("/shop", shopRoutes);

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
    await sequelize.sync({ alter: true });  // ใช้ alter: true เพื่อปรับโครงสร้างตารางที่มีอยู่แล้ว
    console.log('✅ Database tables synchronized');
    
    // เตรียม session store
    await initSessionStore();
    
    // เริ่มเซิร์ฟเวอร์
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// เรียกใช้ฟังก์ชันเริ่มแอปพลิเคชัน
startApp();