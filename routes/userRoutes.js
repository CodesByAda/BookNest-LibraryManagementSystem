const express = require("express");
const Book = require("../models/book");
const User = require("../models/user");
const Admin = require("../models/admin");
const QRCode = require('qrcode');
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();


router.get('/profile/idcard', isLoggedIn, async (req, res) => {
    try {
        const id = req.session.userId;
        if (!id) {
            req.flash("error", "You must be logged in to view your ID card.");
            return res.redirect('/login');
        }

        const student = await User.findById(id);
        if (!student || student.role !== "student"){
            req.flash("error", "Only a student is able to access their id card");
            return res.redirect(`/profile/${id}`);
        }

        // Get current host dynamically
        const host = req.protocol + '://' + req.get('host');
        const profileUrl = `${host}/profile/${student._id}`;

        // Generate QR code
        const qrCode = await QRCode.toDataURL(profileUrl);

        res.render('pages/idcard', { student, qrCode });
    } catch (err) {
        console.error(err);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Internal Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
});

router.get("/profile/:id", isLoggedIn, async (req, res, next) => {
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

        if (!profile) {
            req.flash("error", "No user found with this ID.");
            return res.redirect("back");
        }

        // If user, populate borrowedBooks
        if (profile instanceof User) {
            await profile.populate({
                path: "borrowedBooks.bookId",
                select: "bookname authorname coverImage"
            });

            // Filter out any books that have missing bookId
            profile.borrowedBooks = profile.borrowedBooks.filter(book => book.bookId);
        }

        let isOwner = loggedInUser._id.toString() === id;
        let isAdmin = await Admin.findById(req.session.userId) ? true : false;

        res.render("pages/profile", { profile, isOwner, isAdmin });
    } catch (err) {
        next(err);
    }
});

router.post("/profile/upload-pfp", async (req, res, next) => {
    try {
        console.log("📥 Request received at /profile/upload-pfp");
        console.log("📌 Received Body:", req.body);

        const { profilePic } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).render("pages/error", {
                errorCode: 401,
                errorTitle: "Unauthorized",
                errorMessage: "You need to log in to update your profile picture."
            });
        }

        if (!profilePic || typeof profilePic !== "string" || !profilePic.startsWith("data:image")) {
            req.flash("error", "The uploaded file is not a valid image format.");
            return res.redirect("back");
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "User Not Found",
                errorMessage: "The user does not exist."
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { profilePic } },
            { new: true, upsert: false, useFindAndModify: false }
        );

        if (!updatedUser) {
            return res.status(500).render("pages/error", {
                errorCode: 500,
                errorTitle: "Update Failed",
                errorMessage: "Something went wrong while updating your profile picture."
            });
        }
        req.flash("success", "Profile Picture updated Sucessfully!");
        return res.redirect("back");

    } catch (err) {
        next(err);
    }
});

router.post("/profile/:id/addBook", isLoggedIn, async (req, res) => {
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

        if (!bookId) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Invalid Book Data",
                errorMessage: "No book ID was provided."
            });
        }

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

        if (!user.borrowedBooks) user.borrowedBooks = [];

        user.borrowedBooks.push({ bookId: bookId, dueDate });
        book.stock -= 1;
        await book.save();

        await user.save();
        req.flash("success", "Added Book to borrowed list!");
        req.flash("success", "Total Book Stock sucessfully updated!");
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

router.post("/profile/:id/removeBook/:bookId", isLoggedIn, async (req, res) => {
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
                errorMessage: "Only admins can remove books from a user."
            });
        }

        const { id, bookId } = req.params;
        const user = await User.findById(id);
        const book = await Book.findById(bookId);

        if (!user) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "User Not Found",
                errorMessage: "The requested user does not exist."
            });
        }

        // Remove the book from the borrowedBooks array
        user.borrowedBooks = user.borrowedBooks.filter(book => book.bookId.toString() !== bookId);

        book.stock += 1;
        await book.save();
        await user.save();
        req.flash("success", "Book Sucessfully removed from borrowlist!");
        res.redirect(`/profile/${id}`);

    } catch (err) {
        console.error(err);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Internal Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
});


router.post("/profile/edit/:id", isLoggedIn, async (req, res, next) => {
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

        const updatedUser = await User.findByIdAndUpdate(id, req.body) || await Admin.findByIdAndUpdate(id, req.body);
        req.flash("success", "Your profile was edited sucessfully!");
        res.redirect(`/profile/${id}`);

    } catch (err) {
        next(err);
    }
});

router.post("/profile/change-password/:id", isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        let account = await User.findById(id) || await Admin.findById(id);
        if (!account) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Not Found",
                errorMessage: "Account not found."
            });
        }

        if (account._id.toString() !== req.session.userId) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "You do not have permission to change this password."
            });
        }

        if (account.password !== currentPassword) {
            req.flash("error", "Current password is incorrect.");
            return res.redirect("back");
        }

        account.password = newPassword;
        await account.save();
        req.flash("success", "Password for your account has changed Sucessfully!");
        res.redirect(`/profile/${id}`);
    } catch (err) {
        next(err);
    }
});



module.exports = router;