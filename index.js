require('dotenv').config();
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const session = require("express-session");
const Book = require("./models/book");
const User = require("./models/user");
const Admin = require("./models/admin");
const Bookreq = require("./models/bookreq");
const MongoStore = require("connect-mongo");

const app = express();
const port = 3000;

async function main() {
    // await mongoose.connect("mongodb://localhost:27017/LMS-MGMCET");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅Connected to MongoDB");
}

main().catch(err => console.error("❌MongoDB Connection Error:", err));


app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static('public/uploads'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(methodOverride("_method"));

// 🔹 Session setup (Persistent Login)
app.use(
    session({
        secret: "library_secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            //mongoUrl: "mongodb://localhost:27017/LMS-MGMCET",
            mongoUrl: process.env.MONGO_URL, // MongoDB connection string
            collectionName: "sessions" // Name of the collection in MongoDB
        }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1-week session
    })
);

// 🛠 Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
}
// 🛠 Middleware to check if user is an admin (secure version)
async function isAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).render("pages/error", {
            errorCode: 401,
            errorTitle: "Unauthorized",
            errorMessage: "Please log in to access this page."
        });
    }

    try {
        // Fetch user from DB
        const admin = await Admin.findById(req.session.userId);

        // Check if user exists and is an admin
        if (!admin) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "Access Denied! Admins Only."
            });
        }

        next(); // User is an admin, proceed
    } catch (error) {
        console.error("❌ Error checking admin role:", error);
        return res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
}

// 🏠 Home Route
app.get("/", (req, res) => {
    res.render("pages/index");
});

// 🔐 Register Page
app.get("/register", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/register", { session: req.session });
});

// 🔐 Register User (Handles MongoDB Errors)
app.post("/register", async (req, res, next) => {
    try {
        console.log("📥 Received registration request:", req.body);
        let newUser = new User({ ...req.body, approved: false, role: "student" });
        await newUser.save();
        console.log("✅ User registered successfully:", newUser);

        res.redirect("/");
    } catch (err) {
        next(err); // Pass error to the centralized error handler
    }
});

// 🔐 **Login Page**
app.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/studentLogin", { session: req.session, errorMessage: null });
});

app.get("/adminlogin", (req, res) => {
    if (req.session.userId) return res.redirect("/books");
    res.render("pages/adminLogin", { session: req.session, errorMessage: null });
});

app.post("/login", async (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect("/books");
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.render("pages/error", {
                session: null,
                errorMessage: "Invalid email or password",
                errorCode: 401,
                errorTitle: "Unauthorized Access" // 👈 Add this
            });
        }

        if (!user.approved) {
            return res.render("pages/error", {
                session: null,
                errorMessage: "Your account is not yet approved by the admin.",
                errorCode: 403,
                errorTitle: "Access Denied" // 👈 Add this
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


//Admin login authentication
app.post("/adminlogin", async (req, res, next) => {
    try {
        // ✅ Prevent login if user is already logged in
        if (req.session.userId) {
            return res.redirect("/books");
        }

        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || admin.password !== password) {
            return res.render("pages/error", {
                session: null,
                errorMessage: "Invalid Admin email or password",
                errorCode: 401,
                errorTitle: "Unauthorized Access" // 👈 Add this
            });
        }

        // ✅ Secure session regeneration
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

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect("/books"); // Redirect to books if logout fails
        }
        res.redirect("/login");
    });
});

app.get("/profile/:id", isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const loggedInUser = await User.findById(req.session.userId) || await Admin.findById(req.session.userId);

        if (!loggedInUser) {
            return res.status(401).render("pages/error", {
                errorCode: 401,
                errorTitle: "Unauthorized",
                errorMessage: "You need to log in to access this page."
            });
        }
        let profile = await Admin.findById(id) || await User.findById(id);

        if (profile instanceof User) {
            await profile.populate({
                path: "borrowedBooks.bookId",
                select: "bookname authorname coverImage"
            });

        }


        if (!profile) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Profile Not Found",
                errorMessage: "No user found with this ID."
            });
        }

        let isOwner = loggedInUser._id.toString() === id;
        let isAdmin = await Admin.findById(req.session.userId) ? true : false;

        res.render("pages/profile", { profile, isOwner, isAdmin });
    } catch (err) {
        next(err);
    }
});

app.post("/profile/:id/addBook", isLoggedIn, async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).render("pages/error", {
                errorCode: 401,
                errorTitle: "Unauthorized",
                errorMessage: "You need to log in to access this page."
            });
        }

        const admin = await Admin.findById(req.session.userId);
        if (!admin || admin.role !== "admin") {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "Only admins can add books to a user."
            });
        }

        const { bookId, dueDate } = req.body;
        console.log(req.body);


        if (!bookId) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Invalid Book Data",
                errorMessage: "No book ID was provided."
            });
        }

        // Validate that the book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The book you are trying to add does not exist."
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "User Not Found",
                errorMessage: "The requested user does not exist."
            });
        }

        // Initialize borrowedBooks if not exists
        if (!user.borrowedBooks) user.borrowedBooks = [];

        // Add the single book with due date
        user.borrowedBooks.push({ bookId: bookId, dueDate });

        await user.save();
        res.redirect(`/profile/${req.params.id}`);

    } catch (err) {
        console.error(err);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Internal Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
});



app.post("/profile/edit/:id", isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const loggedInUser = await User.findById(req.session.userId) || await Admin.findById(req.session.userId);

        if (!loggedInUser || loggedInUser._id.toString() !== id) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "You do not have permission to edit this profile."
            });
        }

        // Proceed with profile update logic here
        const updatedUser = await User.findByIdAndUpdate(id, req.body) || await Admin.findByIdAndUpdate(id, req.body);
        res.redirect(`/profile/${id}`);

    } catch (err) {
        next(err);
    }
});

app.post("/profile/change-password/:id", isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Find user in either User or Admin collection
        let account = await User.findById(id) || await Admin.findById(id);
        if (!account) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Not Found",
                errorMessage: "Account not found."
            });
        }

        // Ensure the logged-in user is editing their own password
        if (account._id.toString() !== req.session.userId) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "You do not have permission to change this password."
            });
        }

        // Check if the current password is correct (plain text comparison)
        if (account.password !== currentPassword) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Bad Request",
                errorMessage: "Current password is incorrect."
            });
        }

        // Update password (Plain Text)
        account.password = newPassword;
        await account.save();

        // Redirect back to profile after successful password update
        res.redirect(`/profile/${id}`);
    } catch (err) {
        next(err);
    }
});


// 📚 Books List
app.get("/books", isLoggedIn, async (req, res, next) => {
    try {
        let books = await Book.find({});
        let user = await User.findById(req.session.userId);
        let admin = await Admin.findById(req.session.userId);
        res.render("pages/booklist", { books, session: req.session, user, admin });
        console.log("Session Data:", req.session);
        console.log("Session User ID:", req.session.userId);
    } catch (err) {
        next(err);
    }
});

app.get("/books/:id", isLoggedIn, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.id).populate("reviews.userId", "username");
        let isAdminId = await Admin.exists({ _id: req.session.userId });

        if (!book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book was not found."
            });
        }

        res.render("pages/book", { book, session: req.session, isAdminId });
    } catch (err) {
        next(err);
    }
});


app.post("/books/:id/review", isLoggedIn, async (req, res, next) => {
    try {
        let { rating, comment } = req.body;
        let book = await Book.findById(req.params.id);
        let userId = req.session.userId;

        if (!book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book was not found."
            });
        }

        // Check if the user has already reviewed this book
        let existingReview = book.reviews.find(review => review.userId.toString() === userId);
        if (existingReview) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Review Already Submitted",
                errorMessage: "You can only review once per book."
            });
        }

        let newReview = {
            userId,
            username: req.session.username, // Store username from session
            rating: parseInt(rating),
            comment
        };

        book.reviews.push(newReview);
        await book.save();

        res.redirect(`/books/${req.params.id}`);
    } catch (err) {
        next(err);
    }
});

app.get("/books/editbook/:id", isAdmin, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book does not exist."
            });
        }
        res.redirect("/admin?section=manage-books");
    } catch (err) {
        next(err);
    }
});

app.patch("/books/:id", isAdmin, async (req, res, next) => {
    try {
        let updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body.book, { new: true });
        if (!updatedBook) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book does not exist."
            });
        }
        res.redirect(`/books/${req.params.id}`);
    } catch (err) {
        next(err);
    }
});

// ❌ Admin: Delete Book
app.delete("/books/:id", isAdmin, async (req, res, next) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.redirect("/admin?section=manage-books");
    } catch (err) {
        next(err);
    }
});

app.post("/books/delete-all-books", isAdmin, async (req, res, next) => {
    try {
        await Book.deleteMany({});
        res.redirect("/admin?section=manage-books");
    } catch (err) {
        next(err);
    }
});

app.get("/admin", isAdmin, async (req, res, next) => {
    try {
        const users = await User.find({}); // Fetch all users
        const admins = await Admin.find({}); // Fetch all admins
        const books = await Book.find({}); // Fetch all books

        const pendingApprovals = await User.countDocuments({ approved: false });

        res.render("pages/admin_dashboard", { users, books, admins, pendingApprovals });
    } catch (err) {
        next(err);
    }
});

// Approve User
app.patch("/admin/users/approve/:id", isLoggedIn, isAdmin, async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { approved: true });
    res.redirect("/admin?section=user-management"); // Redirect with the section
});

// Delete User
app.delete("/admin/users/delete/:id", isLoggedIn, isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin?section=user-management"); // Redirect with the section
});

app.post("/admin/addadmin", isAdmin, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.render("pages/error", {
                errorCode: 400,
                errorTitle: "Duplicate Entry",
                errorMessage: "An admin with this email already exists."
            });
        }

        // Create and save new admin
        const newAdmin = new Admin({ name, email, password });
        await newAdmin.save();

        res.redirect("/admin?section=user-management");
    } catch (err) {
        next(err);
    }
});

app.delete("/admin/removeadmin/:id", isAdmin, async (req, res, next) => {
    await Admin.findByIdAndDelete(req.params.id);
    res.redirect("/admin?section=user-management");
});

// 📚 Add New Book
app.get("/admin/addbook", isAdmin, (req, res) => {
    res.render("pages/addbook");
});

app.post("/books", isAdmin, async (req, res, next) => {
    try {
        const bookData = req.body.book; // Access nested book object

        console.log("Full request body:", req.body); // Debugging

        if (!bookData) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Validation Error",
                errorMessage: "Book data is missing."
            });
        }

        let newBook = new Book(bookData); // Create new book with nested object data

        // Debugging: Check Base64 Image
        console.log("Base64 Image String:", bookData.coverImage?.substring(0, 100)); // Show only first 100 chars

        await newBook.save();
        res.redirect("/books");
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(400).render("pages/error", {
            errorCode: 400,
            errorTitle: "Validation Error",
            errorMessage: "Failed to add book. Please check all required fields."
        });
    }
});

app.get("/request-book", isLoggedIn, async (req, res, next) => {
    try {
        res.render("pages/request_book");
    } catch (err) {
        next(err);
    }
});

app.post("/request-book", async (req, res, next) => {
    try {
        console.log("📥 Received book request:", req.body);
        let newBookRequest = new Bookreq(req.body);
        await newBookRequest.save();
        console.log("✅ Book request added successfully:", newBookRequest);
        res.redirect("/books"); // Redirect to /books page after submission
    } catch (err) {
        next(err); // Pass error to the centralized error handler
    }
});


// ❌ Catch 404 Errors (Page Not Found)
app.use((req, res) => {
    res.status(404).render("pages/error", {
        errorCode: 404,
        errorTitle: "Page Not Found",
        errorMessage: "Oops! The page you're looking for doesn't exist."
    });
});

// 🔥 **Global MongoDB Error Handling Middleware**
app.use((err, req, res, next) => {
    console.error("🔥 Unhandled Error:", err);

    let statusCode = 500;
    let errorTitle = "Internal Server Error";
    let errorMessage = "Something went wrong. Please try again later.";

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
        statusCode = 400;
        errorTitle = "Duplicate Entry";
        errorMessage = "A user with this email already exists. Please use a different email.";
    }

    // 🟠 **Handle Invalid MongoDB ObjectId Errors**
    else if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 400;
        errorTitle = "Invalid ID";
        errorMessage = "The provided ID is not valid.";
    }

    // 🟡 **Handle MongoDB Connection Errors**
    else if (err.name === "MongoServerSelectionError") {
        statusCode = 503;
        errorTitle = "Database Connection Error";
        errorMessage = "Failed to connect to the database. Please try again later.";
    }

    res.status(statusCode).render("pages/error", { errorCode: statusCode, errorTitle, errorMessage });
});

// 🚀 Start Server
app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}/`);
});