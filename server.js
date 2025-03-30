require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");

const app = express();
app.use(express.static("public"));

// ✅ ตั้งค่า View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ✅ เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("✅ MongoDB Connected"));
db.on("error", (err) => console.error("❌ MongoDB Error:", err));

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

// ✅ Route ไปหน้า Index
app.get("/", (req, res) => {
  res.render("index"); // แสดงหน้า index.ejs
});

// ✅ เชื่อมต่อ Routes
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");

app.use("/users", requireAuth, userRoutes);
app.use("/", authRoutes); // เส้นทาง `/login` และ `/logout`

// ถ้าไม่พบ path ให้ redirect กลับไปที่หน้าแรก
app.all("*", (req, res) => {
  res.redirect("/");
});

// ✅ เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
