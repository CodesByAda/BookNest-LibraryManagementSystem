const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    bookname: { type: String, required: true },
    authorname: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ["Fiction", "Non-Fiction", "Science", "History", "Technology"]
    },
    isbn: { type: String, required: true },
    description: { type: String },
    availability: {
        type: String,
        required: true,
        enum: ["Available", "Unavailable"]
    },
    rack_location: { type: String, required: true },
    coverImage: { type: String, default: "/images/book.jpg" },
    reviews: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            username: String,
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: String,
            likes: { type: Number, default: 0 },
            dislikes: { type: Number, default: 0 },
            likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who liked
            dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who disliked
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
