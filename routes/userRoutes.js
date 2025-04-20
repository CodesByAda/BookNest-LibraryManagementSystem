const express = require("express");
const Book = require("../models/book");
const User = require("../models/user");
const Admin = require("../models/admin");
const QRCode = require('qrcode');
const Bookreq = require('../models/bookreq');
const moment = require('moment');
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");
const Announcement = require('../models/announcements');
const mongoose = require("mongoose");

const router = express.Router();

router.get("/dashboard", isLoggedIn, async (req, res, next) => {
    try {
        const section = req.query.section || "dashboard";
        const loggedInId = req.session.userId;
        const loggedInUser = await User.findById(loggedInId) || await Admin.findById(loggedInId);
        const isAdmin = await Admin.findById(loggedInId) ? true : false;
        const isStudent = await User.findById(loggedInId) ? true : false;

        const profileId = req.query.id || loggedInId;

        if (profileId !== loggedInId && !isAdmin) {
            req.flash("error", "Unauthorized access.");
            return res.redirect("/dashboard?section=profile");
        }

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            req.flash("error", "Invalid user ID.");
            return res.redirect("/dashboard?section=profile");
        }

        let profile = await Admin.findById(profileId) || await User.findById(profileId);

        if (!profile) {
            req.flash("error", "No user found with this ID.");
            return res.redirect("/dashboard?section=profile");
        }

        // If profile is a User, populate borrowed books
        if (profile instanceof User) {
            await profile.populate({
                path: "borrowedBooks.bookId",
                select: "bookname authorname coverImage"
            });

            profile.borrowedBooks = profile.borrowedBooks.filter(book => book.bookId);
        }

        const isOwner = loggedInUser._id.toString() === profileId;

        const [users, admins, books, bookRequests, adminAcc] = await Promise.all([
            User.find({}),
            Admin.find({}),
            Book.find({}),
            Bookreq.find({}),
            Admin.findById(loggedInId)
        ]);

        const [pendingApprovals, totalStocks, totalBorrowedBooks] = await Promise.all([
            User.countDocuments({ approved: false }),
            Book.aggregate([{ $group: { _id: null, totalStock: { $sum: "$stock" } } }]),
            User.aggregate([{ $unwind: "$borrowedBooks" }, { $count: "totalBorrowedBooks" }])
        ]);

        const totalStockCount = totalStocks[0]?.totalStock || 0;
        const totalBorrowedBooksCount = totalBorrowedBooks[0]?.totalBorrowedBooks || 0;

        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        announcements.forEach(a => {
            a.formattedDateTime = moment(a.createdAt).format('MMMM D, YYYY, h:mm A');
        });

        let expired = [];
        let dueSoon = [];

        if (profile instanceof User) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            profile.borrowedBooks.forEach(b => {
                const dueDate = new Date(b.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate < today) {
                    expired.push({
                        bookId: b.bookId,
                        dueDate,
                        status: "Overdue"
                    });
                } else {
                    dueSoon.push({
                        bookId: b.bookId,
                        dueDate,
                        status: "Active",
                        daysLeft: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
                    });
                }
            });
        }

        let borrowData = null;

        if (section === "track-borrows" && req.session.borrowStudentId) {
            const user = await User.findById(req.session.borrowStudentId).populate({
                path: "borrowedBooks.bookId",
                select: "bookname authorname coverImage category description stock"
            });

            if (user) {
                user.borrowedBooks = user.borrowedBooks.filter(book => book.bookId);

                const trackedExpired = [];
                const trackedDueSoon = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                user.borrowedBooks.forEach(b => {
                    const dueDate = new Date(b.dueDate);
                    dueDate.setHours(0, 0, 0, 0);

                    if (dueDate < today) {
                        trackedExpired.push({
                            bookId: b.bookId,
                            dueDate,
                            status: "Overdue"
                        });
                    } else {
                        trackedDueSoon.push({
                            bookId: b.bookId,
                            dueDate,
                            status: "Active",
                            daysLeft: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
                        });
                    }
                });

                borrowData = {
                    name: user.name,
                    registration: `${user.course}/S${user.semester}`,
                    registrationNumber: user.rollno,
                    email: user.email,
                    mongoId: user._id,
                    expired: trackedExpired,
                    dueSoon: trackedDueSoon
                };
            } else {
                req.session.borrowStudentId = null;
                req.flash("error", "Student not found");
            }
        }

        const reccbooks = await Book.aggregate([{ $sample: { size: 9 } }]); // get 9 random books
        const groupedBooks = [];

        for (let i = 0; i < reccbooks.length; i += 3) {
            groupedBooks.push(reccbooks.slice(i, i + 3));
        }

        const host = req.protocol + '://' + req.get('host');
        const profileUrl = `${host}/dashboard?section=profile&id=${profile._id}`;
        const qrCode = await QRCode.toDataURL(profileUrl);


        res.render("pages/dashboard", {
            adminAcc,
            users,
            books,
            bookRequests,
            admins,
            pendingApprovals,
            totalStockCount,
            totalBorrowedBooksCount,
            announcements,
            recommendations: groupedBooks,
            borrowData,
            expired,
            dueSoon,
            profile,
            isOwner,
            isAdmin,
            isStudent,
            loggedInUser,
            qrCode,
            session: req.session
        });
    } catch (err) {
        next(err);
    }
});

router.get("/announcements", isLoggedIn, async (req, res) => {
    try {
        const id = req.session.userId;

        let profile = await User.findById(id) || await Admin.findById(id);
        let isAdmin = await Admin.findById(req.session.userId) ? true : false;

        if (!profile) {
            return res.status(401).render("pages/error", {
                errorCode: 401,
                errorTitle: "Unauthorized",
                errorMessage: "No student found with the current ID"
            });
        }
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.render('pages/announcements', { announcements, profile, isAdmin });
    } catch (err) {
        console.error(err);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Internal Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
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
        const userId = req.params.id;

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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "User Not Found",
                errorMessage: "The requested user does not exist."
            });
        }

        if (!user.borrowedBooks) user.borrowedBooks = [];

        // 🔍 Check if the user already has the book
        const alreadyBorrowed = user.borrowedBooks.some(b => b.bookId.toString() === bookId);
        if (alreadyBorrowed) {
            req.flash("error", `"${book.bookname}" is already borrowed by the user.`);
            return res.redirect(`/dashboard?section=profile&id=${userId}`);
        }

        // 📚 Add new borrow
        user.borrowedBooks.push({
            bookId: bookId,
            borrowedDate: new Date(),
            dueDate: dueDate
        });

        // 📦 Decrement stock
        book.stock -= 1;
        await book.save();
        await user.save();

        req.flash("success", `"${book.bookname}" added to borrowed list.`);
        req.flash("success", "Book stock successfully updated.");
        res.redirect(`/dashboard?section=profile&id=${userId}`);

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
        res.redirect(`/dashboard?section=profile&id=${id}`);

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
        const sessionId = req.session.userId;

        if (!sessionId || sessionId !== id) {
            return res.status(403).render("pages/error", {
                errorCode: 403,
                errorTitle: "Forbidden",
                errorMessage: "You do not have permission to edit this profile."
            });
        }

        const { name, email, phone, address, course, semester, profilePic } = req.body;

        const user = await User.findById(id) || await Admin.findById(id);
        if (!user) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "User Not Found",
                errorMessage: "The user does not exist."
            });
        }

        const updateData = {};
        if (name && name !== user.name) updateData.name = name;
        if (email && email !== user.email) updateData.email = email;
        if (phone && phone !== user.phone) updateData.phone = phone;
        if (address && address !== user.address) updateData.address = address;
        if (course && course !== user.course) updateData.course = course;
        if (semester && semester !== user.semester) updateData.semester = semester;

        // Base64 profilePic check
        if (profilePic && typeof profilePic === "string" && profilePic.startsWith("data:image") && profilePic !== user.profilePic) {
            updateData.profilePic = profilePic;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { new: true, upsert: false, useFindAndModify: false }
        ) || await Admin.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { new: true, upsert: false, useFindAndModify: false }
        );

        if (!updatedUser) {
            return res.status(500).render("pages/error", {
                errorCode: 500,
                errorTitle: "Update Failed",
                errorMessage: "Something went wrong while updating your profile."
            });
        }

        req.flash("success", "Your profile was updated successfully!");
        return res.redirect(`/dashboard?section=profile`);
    } catch (err) {
        console.error("❌ Error updating profile:", err);
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
            return res.redirect("/dashboard?section=profile");
        }

        account.password = newPassword;
        await account.save();
        req.flash("success", "Password for your account has changed Sucessfully!");
        res.redirect(`/dashboard?section=profile`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;