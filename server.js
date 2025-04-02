require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const app = express();

// ✅ ตั้งค่า Static Files
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



const db = mongoose.connection;
db.once("open", () => console.log("✅ MongoDB Connected"));
db.on("error", (err) => console.error("❌ MongoDB Error:", err));

// ✅ ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ✅ ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// ✅ ตั้งค่า Session
app.use(
  session({
    secret: "myshopsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 ชั่วโมง
  })
);

// ✅ กำหนดตัวแปร Global
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ✅ Middleware ตรวจสอบการล็อกอิน
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// ✅ Route ไปหน้า Login
app.get("/login", (req, res) => {
  res.render("./auth/login", { title: "เข้าสู่ระบบ", layout: "layouts/main", isLoginPage: true });
});



// ✅ เชื่อมต่อ Routes
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const mainRoutes = require("./src/routes/mainRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");

const Category = require("./src/models/categoryModel"); // Import Model

app.use(async (req, res, next) => {
  try {
    res.locals.categories = await Category.find(); // ทำให้ categories ใช้ได้ทุกหน้า
  } catch (error) {
    res.locals.categories = []; // ถ้า error ให้เป็น array ว่าง
  }
  next();
});


// ✅ Route ไปหน้า Index
const categoryController = require("./src/controllers/categoryController"); // เพิ่มการ import
app.get("/", categoryController.getCategoriesForIndex);

app.use("/users", requireAuth, userRoutes);
app.use("/categories",requireAuth, categoryRoutes);
app.use("/products", productRoutes);
app.use("/", authRoutes ,categoryRoutes); // เส้นทาง `/login` และ `/logout`
// ดึงข้อมูลหมวดหมู่ทั้งหมดและแสดงในหน้าแรก



// ✅ จัดการเส้นทางที่ไม่พบ
app.all("*", (req, res) => {
  res.redirect("/");
});

// ✅ เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
