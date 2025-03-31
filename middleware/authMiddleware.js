const Admin = require("../models/admin");

function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/");
    }
    next();
}

async function isAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).render("pages/error", {
            errorCode: 401,
            errorTitle: "Unauthorized",
            errorMessage: "Please log in to access this page."
        });
    }

    try {
        const admin = await Admin.findById(req.session.userId);

        if (!admin) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "Access Denied! Admins Only."
            });
        }

        next();
    } catch (error) {
        console.error("❌ Error checking admin role:", error);
        return res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
}

module.exports = { isLoggedIn, isAdmin };