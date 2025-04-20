const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },   // Made required for consistent validation
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    rollno: { type: String, required: true },   // Changed to String
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },    // Changed to String
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },
    role: { type: String, default: "student" },

    profilePic: String,

    borrowedBooks: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        borrowedDate: { type: Date, required: true },
        dueDate: { type: Date, required: true }
    }],
    wishlist: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" }
    }]
});

module.exports = mongoose.model("User", userSchema);