const User = require("../models/User");

// 📌 GET: แสดง Users ทั้งหมด
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.render("users/list", { title: "รายชื่อผู้ใช้", users, content: "users/list" });
};

// 📌 GET: ฟอร์มเพิ่ม User
exports.newUserForm = (req, res) => {
  res.render("users/new");
};

// 📌 POST: เพิ่ม User
exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    await User.create({ name, email, password });
    res.redirect("/users/list"); // เปลี่ยนเส้นทางไป list
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).send("Internal Server Error");
  }
};

// 📌 GET: ฟอร์มแก้ไข User
exports.editUserForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render("users/edit", { user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).send("Internal Server Error");
  }
};

const bcrypt = require("bcryptjs"); // เพิ่ม bcrypt
// 📌 PUT: อัปเดต User
exports.updateUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const updatedData = { name, email };

    // ถ้ามีการเปลี่ยนรหัสผ่าน ให้แฮชก่อนบันทึก
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.redirect("/users/list");
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).send("Internal Server Error");
  }
};

// 📌 DELETE: ลบ User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/users/list");
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).send("Internal Server Error");
  }
};
