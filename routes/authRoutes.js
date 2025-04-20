const express = require("express");
const User = require("../models/user");
const Admin = require("../models/admin");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { emitEvent } = require("../utils/socket");

const router = express.Router();

router.get("/register", (req, res) => {
    if (req.session.userId) return res.redirect("/dashboard");
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

        req.flash("success", "Registration successful! Please wait for admin approval.You will be notified via email.");
        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

router.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/dashboard");
    res.render("pages/login", { session: req.session, errorMessage: null });
});

router.get("/adminlogin", (req, res) => {
    if (req.session.userId) return res.redirect("/dashboard");
    res.render("pages/login", { session: req.session, errorMessage: null });
});

router.post("/login", async (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect("/books");
        }

        const { email, password, userType } = req.body;

        const dbModel = userType === "librarian" ? Admin : User;
        const user = await dbModel.findOne({ email });

        if (!user || user.password !== password) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/");
        }

        if (userType === "student" && !user.approved) {
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

            console.log(`🔓 ${userType === "librarian" ? "Admin" : "User"} logged in: ${user.email}`);
            res.redirect("/dashboard");
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