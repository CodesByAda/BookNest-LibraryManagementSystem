require("dotenv").config();
const express = require("express");
const Book = require("../models/book");
const Bookreq = require('../models/bookreq');
const User = require("../models/user");
const Admin = require("../models/admin");
const Announcement = require('../models/announcements');
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");
const moment = require('moment');
const sendMail = require('../mailer/sendMail');

const router = express.Router();

router.patch("/admin/users/approve/:id", isLoggedIn, isAdmin, async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/dashboard?section=user-management");
        }

        user.approved = true;
        await user.save();
        let href = req.protocol + '://' + req.get('host') + '/login';
        await sendMail(
            user.email,
            'Your BookNest Account is Approved!',
            'welcome-approved.mjml',
            { username: user.name, ctaLink: href },
        );

        req.flash("success", "User approved successfully.");
        res.redirect("/dashboard?section=user-management");
    } catch (err) {
        next(err);
    }
});

router.delete("/admin/users/delete/:id", isLoggedIn, isAdmin, async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/dashboard?section=user-management");
        }

        await User.findByIdAndDelete(req.params.id);

        req.flash("success", "User deleted successfully.");
        res.redirect("/dashboard?section=user-management");
    } catch (err) {
        next(err);
    }
});

router.post("/admin/addadmin", isAdmin, async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            req.flash("error", "An admin with this email already exists.");
            return res.redirect("/dashboard?section=user-management");
        }

        const newAdmin = new Admin({ name, email, password, phone });
        await newAdmin.save();

        req.flash("success", "Admin added successfully");
        res.redirect("/dashboard?section=user-management");
    } catch (err) {
        next(err);
    }
});


router.delete("/admin/removeadmin/:id", isAdmin, async (req, res, next) => {
    try {
        const adminToDelete = await Admin.findById(req.params.id);

        if (!adminToDelete) {
            req.flash("error", "Admin not found.");
            return res.redirect("/dashboard?section=user-management");
        }

        // Prevent deleting self
        if (adminToDelete._id.equals(req.session.userId)) {
            req.flash("error", "You cannot delete your own admin account.");
            return res.redirect("/dashboard?section=user-management");
        }

        // Check if it's the last admin
        const adminCount = await Admin.countDocuments();
        if (adminCount <= 1) {
            req.flash("error", "At least one admin must remain.");
            return res.redirect("/dashboard?section=user-management");
        }

        await Admin.findByIdAndDelete(req.params.id);
        req.flash("success", "Admin removed successfully.");
        res.redirect("/dashboard?section=user-management");

        console.log("Delete Request ID:", req.params.id);

    } catch (err) {
        next(err);
    }
});

router.post('/admin/addannouncement', async (req, res) => {
    try {
        const { title, message, importance } = req.body;

        const newAnnouncement = new Announcement({ title, message, importance });
        await newAnnouncement.save();

        let href = req.protocol + '://' + req.get('host') + '/dashboard?section=announcements';

        if (importance === 'High') {
            const users = await User.find({});
            for (const user of users) {
                await sendMail(
                    user.email,
                    'Important Announcement from Library',
                    'important-announcement.mjml',
                    { 
                        username: user.name,
                        announcementTitle: title, 
                        announcementContent: message,
                        ctaLink: href
                    },
                );
            }
        }

        req.flash('success', 'Announcement posted successfully');
        res.redirect('/dashboard?section=announcements');
    } catch (error) {
        console.error('Error posting announcement:', error);
        req.flash('error', 'Failed to post announcement');
        res.redirect('/dashboard?section=announcements');
    }
});

router.post('/admin/removeannouncement/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            req.flash('error', 'Announcement not found');
            return res.redirect('/dashboard?section=announcements');
        }

        await Announcement.findByIdAndDelete(id);
        req.flash('success', 'Announcement deleted successfully');
        res.redirect('/dashboard?section=announcements');
    } catch (error) {
        console.error('Error deleting announcement:', error);
        req.flash('error', 'Failed to delete announcement');
        res.redirect('/dashboard?section=announcements');
    }
});

router.post("/trackborrows", async (req, res) => {
    const { studentId } = req.body;

    try {
        let user;
        if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(studentId);
        }

        if (!user) {
            user = await User.findOne({ rollno: studentId });
        }

        if (!user) {
            req.flash("error", "Student not found");
            return res.redirect("/dashboard?section=track-borrows");
        }

        req.session.borrowStudentId = user._id;
        res.redirect("/dashboard?section=track-borrows");
        res
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/dashboard?section=track-borrows");
    }
});

router.post("/admin/addborrows/:id", async (req, res) => {
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
                errorMessage: "Only admins can assign books."
            });
        }

        const { id } = req.params;
        const { bookId, dueDate } = req.body;

        if (!bookId) {
            req.flash("error", "Book ID is required");
            return res.redirect("/dashboard?section=track-borrows");
        }

        const user = await User.findById(id);
        const book = await Book.findById(bookId);

        if (!user || !book) {
            req.flash("error", "Invalid user or book");
            return res.redirect("/dashboard?section=track-borrows");
        }

        // Check if the user already borrowed this book
        const alreadyBorrowed = user.borrowedBooks.some(b => b.bookId.toString() === bookId);
        if (alreadyBorrowed) {
            req.flash("error", "Book is already borrowed by this user");
            return res.redirect("/dashboard?section=track-borrows");
        }

        // Check if book is in stock
        if (book.stock <= 0) {
            req.flash("error", "Book is out of stock");
            return res.redirect("/dashboard?section=track-borrows");
        }

        user.borrowedBooks.push({
            bookId: book._id,
            borrowedDate: new Date(),
            dueDate: new Date(dueDate)
        });

        book.stock -= 1;

        await user.save();
        await book.save();

        const borrowedRecord = user.borrowedBooks.find(b => b.bookId.toString() === bookId);

        if (!borrowedRecord) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Borrow Record Not Found",
                errorMessage: "Borrowed book record not found for this user."
            });
        }

        const BorrowDate = new Date(borrowedRecord.borrowedDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const DueDate = new Date(borrowedRecord.dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        await sendMail(
            user.email,
            'Book Borrow Confirmation',
            'borrow-confirmation.mjml',
            {
                username: user.name,
                bookTitle: book.bookname,
                BorrowDate,
                DueDate,
                bookId: book._id,
            }
        );        

        req.flash("success", "Book added to user's borrowed list!");
        req.flash("success", "Book stock successfully updated!");
        res.redirect("/dashboard?section=track-borrows");

    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again later.");
        res.redirect("/dashboard?section=track-borrows");
    }
});

router.post("/admin/returnbook/:userId/:bookId", async (req, res) => {
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
                errorMessage: "Only admins can perform this action."
            });
        }

        const { userId, bookId } = req.params;

        const user = await User.findById(userId);
        const book = await Book.findById(bookId);

        if (!user || !book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Not Found",
                errorMessage: "User or book not found."
            });
        }

        const borrowedRecord = user.borrowedBooks.find(b => b.bookId.toString() === bookId);

        if (!borrowedRecord) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Borrow Record Not Found",
                errorMessage: "Borrowed book record not found for this user."
            });
        }

        const BorrowDate = new Date(borrowedRecord.borrowedDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const returnDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const dueDateFormatted = new Date(borrowedRecord.dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Remove book from user's borrowed list
        user.borrowedBooks = user.borrowedBooks.filter(b => b.bookId.toString() !== bookId);
        await user.save();

        // Increment stock
        book.stock += 1;
        await book.save();

        await sendMail(
            user.email,
            'Book Return Confirmation',
            'return-confirmation.mjml',
            {
                username: user.name,
                bookTitle: book.bookname,
                BorrowDate,
                returnDate,
                dueDate: dueDateFormatted,
                bookId: book._id,
            }
        );   

        req.flash("success", `"${book.bookname}" marked as returned.`);
        res.redirect("/dashboard?section=track-borrows");
    } catch (err) {
        console.error(err);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Internal Server Error",
            errorMessage: "Something went wrong. Please try again later."
        });
    }
});


module.exports = router;