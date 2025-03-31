const errorMiddleware = (err, req, res, next) => {
    console.error("🔥 Unhandled Error:", err);

    let statusCode = err.status || 500;
    let errorTitle = err.title || "Internal Server Error";
    let errorMessage = err.message || "Something went wrong. Please try again later.";

    // 🟢 **Handle MongoDB Validation Errors**
    if (err.name === "ValidationError") {
        statusCode = 400;
        errorTitle = "Invalid Data";
        errorMessage = Object.values(err.errors)
            .map(e => e.message)
            .join(", ");
    }

    // 🔴 **Handle Duplicate Key Error (E11000)**
    else if (err.code === 11000) {
        req.flash("error", "A user with this email already exists. Please use a different email.");
        return res.redirect("back");
    }

    // 🟠 **Handle Invalid MongoDB ObjectId Errors**
    else if (err.name === "CastError" && err.kind === "ObjectId") {
        req.flash("error", "The provided ID is not valid.");
        return res.redirect("back");
    }

    // 🟡 **Handle MongoDB Connection Errors**
    else if (err.name === "MongoServerSelectionError") {
        statusCode = 503;
        errorTitle = "Database Connection Error";
        errorMessage = "Failed to connect to the database. Please try again later.";
    }

    res.status(statusCode).render("pages/error", { errorCode: statusCode, errorTitle, errorMessage });
};

// ❌ **Catch 404 Errors (Page Not Found)**
const notFoundMiddleware = (req, res) => {
    res.status(404).render("pages/error", {
        errorCode: 404,
        errorTitle: "Page Not Found",
        errorMessage: "Oops! The page you're looking for doesn't exist."
    });
};

module.exports = { errorMiddleware, notFoundMiddleware };
