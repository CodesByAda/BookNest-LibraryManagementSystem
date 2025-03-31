const express = require("express");
const Book = require("../models/book");
const Bookreq = require('../models/bookreq');
const User = require("../models/user");
const Admin = require("../models/admin");
const Announcement = require('../models/announcements');
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");
const moment = require('moment');

const router = express.Router();

router.get("/admin", isAdmin, async (req, res, next) => {
    try {
        const users = await User.find({});
        const admins = await Admin.find({});
        const books = await Book.find({});
        const bookRequests = await Bookreq.find({})
        const adminAcc = await Admin.findById(req.session.userId); 

        const pendingApprovals = await User.countDocuments({ approved: false });

        const totalStocks = await Book.aggregate([
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ]);
        const totalStockCount = totalStocks.length > 0 ? totalStocks[0].totalStock : 0;

        const totalBorrowedBooks = await User.aggregate([
            { $unwind: "$borrowedBooks" },  // Flatten the borrowedBooks array
            { $count: "totalBorrowedBooks" } // Count the number of borrowed books
        ]);
        
        const totalBorrowedBooksCount = totalBorrowedBooks.length > 0 ? totalBorrowedBooks[0].totalBorrowedBooks : 0;

        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        announcements.forEach(announcement => {
            announcement.formattedDate = moment(announcement.createdAt).format('MMMM D, YYYY');
        });

        res.render("pages/admin_dashboard", { adminAcc, users, books, bookRequests, admins, pendingApprovals, totalStockCount, totalBorrowedBooksCount, announcements, session: req.session });
    } catch (err) {
        next(err);
    }
});

// Approve User
router.patch("/admin/users/approve/:id", isLoggedIn, isAdmin, async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin?section=user-management");
        }

        user.approved = true;
        await user.save();

        req.flash("success", "User approved successfully.");
        res.redirect("/admin?section=user-management");
    } catch (err) {
        next(err);
    }
});

// Delete User
router.delete("/admin/users/delete/:id", isLoggedIn, isAdmin, async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin?section=user-management");
        }

        await User.findByIdAndDelete(req.params.id);

        req.flash("success", "User deleted successfully.");
        res.redirect("/admin?section=user-management");
    } catch (err) {
        next(err);
    }
});

router.post("/admin/addadmin", isAdmin, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            req.flash("error", "An admin with this email already exists.");
            return res.redirect("/admin?section=user-management");
        }

        // Create and save new admin
        const newAdmin = new Admin({ name, email, password });
        await newAdmin.save();

        req.flash("success", "Admin added successfully");
        res.redirect("/admin?section=user-management");
    } catch (err) {
        next(err);
    }
});

router.delete("/admin/removeadmin/:id", isAdmin, async (req, res, next) => {
    try {
        let adminToDelete = await Admin.findById(req.params.id);

        if (!adminToDelete) {
            req.flash("error", "Admin not found.");
            return res.redirect("/admin?section=user-management");
        }

        let adminCount = await Admin.countDocuments();
        if (adminCount <= 1) {
            req.flash("error", "At least one admin must remain.");
            return res.redirect("/admin?section=user-management");
        }

        await Admin.findByIdAndDelete(req.params.id);
        req.flash("success", "Admin removed successfully.");
        res.redirect("/admin?section=user-management");

    } catch (err) {
        next(err);
    }
});


// 📚 Add New Book
router.get("/admin/addbook", isAdmin, (req, res) => {
    res.render("pages/addbook");
});


router.post('/admin/addannouncement', async (req, res) => {
    try {
        const { title, message } = req.body;

        // Create and save new announcement
        const newAnnouncement = new Announcement({ title, message });
        await newAnnouncement.save();

        req.flash('success', 'Announcement posted successfully');
        res.redirect('/admin/?section=announcements');
    } catch (error) {
        console.error('Error posting announcement:', error);
        req.flash('error', 'Failed to post announcement');
        res.redirect('/admin/?section=announcements');
    }
});

router.post('/admin/removeannouncement/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            req.flash('error', 'Announcement not found');
            return res.redirect('/admin/?section=announcements');
        }

        await Announcement.findByIdAndDelete(id);
        req.flash('success', 'Announcement deleted successfully');
        res.redirect('/admin/?section=announcements');
    } catch (error) {
        console.error('Error deleting announcement:', error);
        req.flash('error', 'Failed to delete announcement');
        res.redirect('/admin/?section=announcements');
    }
});

module.exports = router;