const express = require("express");
const User = require("../models/user");
const Admin = require("../models/admin");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { emitEvent } = require("../utils/socket");

const router = express.Router();

router.get("/register", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/register", { session: req.session });
});

router.post("/register", async (req, res, next) => {
    try {
        let newUser = new User({ ...req.body, approved: false, role: "student" });
        await newUser.save();
        
        emitEvent("newRegistration", {
            message: "A new student has registered!",
            timestamp: new Date(),
        });
        console.log("✅ User registered successfully:", newUser);

        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

router.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/studentLogin", { session: req.session, errorMessage: null });
});

router.get("/adminlogin", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/adminLogin", { session: req.session, errorMessage: null });
});

router.post("/login", async (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect("/books");
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/");
        }

        if (!user.approved) {
            return res.render("pages/error", {
                session: null,
                errorMessage: "Your account is not yet approved by the admin.",
                errorCode: 403,
                errorTitle: "Access Denied"
            });
        }

        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.userId = user._id;
            req.session.username = user.name;

            console.log(`🔓 User logged in: ${user.email}`);
            res.redirect("/books");
        });

    } catch (err) {
        next(err);
    }
});


router.post("/adminlogin", async (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect("/books");
        }

        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || admin.password !== password) {
            req.flash("error", "Invalid Admin email or password");
            return res.redirect("/");
        }

        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.userId = admin._id;
            req.session.username = admin.name;

            console.log(`🔓 User logged in: ${admin.email}`);
            res.redirect("/admin");
        });

    } catch (err) {
        next(err);
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect("/books");
        }
        res.redirect("/");
    });
});

module.exports = router;