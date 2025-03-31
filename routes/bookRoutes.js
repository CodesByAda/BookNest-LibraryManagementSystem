const express = require("express");
const Book = require("../models/book");
const User = require("../models/user");
const Admin = require("../models/admin");
const Announcement = require('../models/announcements');
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");
const BookReq = require("../models/bookreq");
const moment = require('moment');
const router = express.Router();

router.get("/books", isLoggedIn, async (req, res, next) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = 11; // 11 books per page
        let skip = (page - 1) * limit;
        let searchQuery = req.query.search ? req.query.search.trim().toLowerCase() : "";

        // If searchQuery is empty, fetch all books; otherwise, apply regex search
        let query = searchQuery ? { bookname: { $regex: searchQuery, $options: "i" } } : {};

        // Count total books (filtered or all)
        const totalBooks = await Book.countDocuments(query);

        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        announcements.forEach(announcement => {
            announcement.formattedDate = moment(announcement.createdAt).format('MMMM D, YYYY');
        });

        // Fetch paginated books
        const books = await Book.find(query).skip(skip).limit(limit);

        let user = await User.findById(req.session.userId);
        let admin = await Admin.findById(req.session.userId);
        let isAdminId = await Admin.exists({ _id: req.session.userId });

        res.render("pages/booklist", {
            books,
            session: req.session,
            user,
            admin,
            isAdminId,
            totalBooks,
            currentPage: page,
            totalPages: Math.ceil(totalBooks / limit),
            searchQuery,
            announcements
        });
    } catch (err) {
        next(err);
    }
});


router.post("/books", isAdmin, async (req, res) => {
    try {
        const { bookname, authorname, category, stock, description, availability, rack_location, base64CoverImage } = req.body;

        console.log("Received book data:", req.body);

        if (!bookname || !authorname || !category || !stock || !description || !availability || !rack_location) {
            return res.status(400).render("pages/error", {
                errorCode: 400,
                errorTitle: "Validation Error",
                errorMessage: "All fields are required.",
            });
        }

        // Create a new book document
        let newBook = new Book({
            bookname,
            authorname,
            category,
            stock,
            description,
            availability,
            rack_location,
            coverImage: base64CoverImage ? `data:image/png;base64,${base64CoverImage}` : "/images/book.jpg", // Store as base64
        });

        await newBook.save();
        req.flash("success", "Book added successfully.");
        res.redirect("/books");
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).render("pages/error", {
            errorCode: 500,
            errorTitle: "Server Error",
            errorMessage: "Failed to add book. Please try again later.",
        });
    }
});


router.get("/books/:id", isLoggedIn, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.id);
        let isAdminId = await Admin.exists({ _id: req.session.userId });
        let user = await User.findById(req.session.userId);
        let admin = await Admin.findById(req.session.userId);

        if (!book) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book was not found."
            });
        }

        let reviewsWithPermissions = book.reviews.map(review => {
            let reviewObject = review.toObject();
            reviewObject.canDelete = review.userId && review.userId.toString() === req.session.userId.toString();
            return reviewObject;
        });

        res.render("pages/book", {
            book: { ...book.toObject(), reviews: reviewsWithPermissions },
            session: req.session,
            isAdminId,
            user,
            admin
        });
    } catch (err) {
        next(err);
    }
});



router.post("/books/:id/review", isLoggedIn, async (req, res, next) => {
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

        let existingReview = book.reviews.find(review => review.userId.toString() === userId);
        if (existingReview) {
            req.flash("error", "You can only review once per book.");
            return res.redirect("back");
        }

        let newReview = {
            userId,
            username: req.session.username,
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

router.post("/books/:bookId/reviews/:reviewId/like", isLoggedIn, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.bookId);
        if (!book) return res.status(404).send("Book not found");

        let review = book.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).send("Review not found");

        let userId = req.session.userId.toString();

        if (!review.likedBy) review.likedBy = [];
        if (!review.dislikedBy) review.dislikedBy = [];

        if (review.likedBy.includes(userId)) {
            review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
            if (review.likes > 0) review.likes -= 1;
        } else {
            review.likedBy.push(userId);
            review.likes += 1;

            if (review.dislikedBy.includes(userId)) {
                review.dislikedBy = review.dislikedBy.filter(id => id.toString() !== userId);
                if (review.dislikes > 0) review.dislikes -= 1;
            }
        }

        await book.save();
        res.redirect(`/books/${req.params.bookId}`);
    } catch (err) {
        next(err);
    }
});

router.post("/books/:bookId/reviews/:reviewId/dislike", isLoggedIn, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.bookId);
        if (!book) return res.status(404).send("Book not found");

        let review = book.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).send("Review not found");

        let userId = req.session.userId.toString();

        if (!review.likedBy) review.likedBy = [];
        if (!review.dislikedBy) review.dislikedBy = [];

        if (review.dislikedBy.includes(userId)) {
            review.dislikedBy = review.dislikedBy.filter(id => id.toString() !== userId);
            if (review.dislikes > 0) review.dislikes -= 1;
        } else {
            review.dislikedBy.push(userId);
            review.dislikes += 1;

            if (review.likedBy.includes(userId)) {
                review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
                if (review.likes > 0) review.likes -= 1;
            }
        }

        await book.save();
        res.redirect(`/books/${req.params.bookId}`);
    } catch (err) {
        next(err);
    }
});

router.post("/books/:bookId/reviews/:reviewId/delete", isLoggedIn, async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.bookId);
        if (!book) return res.status(404).send("Book not found");

        let review = book.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).send("Review not found");

        if (review.userId.toString() !== req.session.userId.toString()) {
            return res.status(403).send("You are not allowed to delete this review");
        }

        review.deleteOne();
        await book.save();
        req.flash("success", "Review deleted successfully.");
        res.redirect(`/books/${req.params.bookId}`);
    } catch (err) {
        next(err);
    }
});


router.get("/books/editbook/:id", isAdmin, async (req, res, next) => {
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

router.patch("/books/:id", isAdmin, async (req, res, next) => {
    try {
        console.log("Received Data:", req.body); // Debugging

        // Fetch the existing book document
        let existingBook = await Book.findById(req.params.id);
        if (!existingBook) {
            return res.status(404).render("pages/error", {
                errorCode: 404,
                errorTitle: "Book Not Found",
                errorMessage: "The requested book does not exist."
            });
        }

        // Extract form data
        const { bookname, authorname, category, stock, description, availability, rack_location, base64CoverImage } = req.body;

        // Construct updateData only with modified values
        let updateData = {};

        if (bookname?.trim()) updateData.bookname = bookname;
        if (authorname?.trim()) updateData.authorname = authorname;
        if (category?.trim()) updateData.category = category;
        if (stock?.trim()) updateData.stock = stock;
        if (description?.trim()) updateData.description = description;
        if (availability?.trim()) updateData.availability = availability;
        if (rack_location?.trim()) updateData.rack_location = rack_location;

        // **Fix: Properly handle cover image updates**
        if (base64CoverImage && base64CoverImage.startsWith("data:image/")) {
            // Only update if it's a valid Base64 string
            updateData.coverImage = base64CoverImage;
        } else {
            // Preserve old cover image
            updateData.coverImage = existingBook.coverImage;
        }

        // Update book in the database
        let updatedBook = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });

        console.log("Updated Book:", updatedBook); // Debugging
        req.flash("success", "Book updated successfully.");
        res.redirect(`/books/${req.params.id}`);
    } catch (err) {
        next(err);
    }
});




router.delete("/books/:id", isAdmin, async (req, res, next) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        req.flash("success", "Book deleted successfully.");
        res.redirect("/admin?section=book-management");
    } catch (err) {
        next(err);
    }
});

router.post("/books/delete-all-books", isAdmin, async (req, res, next) => {
    try {
        await Book.deleteMany({});
        req.flash("success", "All books deleted successfully.");
        res.redirect("/admin?section=book-management");
    } catch (err) {
        next(err);
    }
});

router.post("/book-requests", async (req, res, next) => {
    try {
        const { bookname, authorname, referenceLink } = req.body;

        if (!bookname.trim() || !authorname.trim() || !referenceLink.trim()) {
            req.flash("error", "All fields are required.");
            return res.redirect("back");
        }

        // Create new book request
        let newBookRequest = new BookReq({
            bookname: bookname.trim(),
            authorname: authorname.trim(),
            referenceLink: referenceLink.trim(),
            requestedAt: new Date() // Optional timestamp
        });

        await newBookRequest.save();
        req.flash("success", "Book request submitted successfully.");
        res.redirect("/books");
    } catch (err) {
        next(err);
    }
});

router.post('/book-requests/approve/:id', async (req, res) => {
    const { id } = req.params;
    await BookReq.findByIdAndUpdate(id, { approved: true });
    await BookReq.findByIdAndDelete(id);
    req.flash("success", "Book request approved.");
    res.redirect('/admin/?section=book-req');
});

// Remove Request
router.post('/book-requests/remove/:id', async (req, res) => {
    const { id } = req.params;
    await BookReq.findByIdAndDelete(id);
    req.flash("success", "Book request rejected!");
    res.redirect('/admin/?section=book-req');
});

module.exports = router;