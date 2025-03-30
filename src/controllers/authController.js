const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.getLoginPage = (req, res) => {
    res.render("auth/login");
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send("❌ Invalid email or password!");
    }

    req.session.user = user;
    res.redirect("/");
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};
