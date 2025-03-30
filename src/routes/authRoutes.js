const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", authController.getLoginPage);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

// 📌 GET: Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/"); // กลับไปหน้า Login
    });
  });

module.exports = router;
