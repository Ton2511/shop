const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected...");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // ปิดโปรแกรมถ้าเชื่อมต่อไม่สำเร็จ
  }
};

module.exports = connectDB;
