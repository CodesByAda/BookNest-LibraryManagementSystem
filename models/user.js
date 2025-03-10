const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: false },
    course: { type: String, required: false },
    semester: { type: Number, required: false },
    rollno: { type: Number, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },
    role: { type: String, default: "student" },

    // New field: Array of borrowed books
    borrowedBooks: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" }, // Reference to Book model
        dueDate: { type: Date, required: true } // Due date for returning the book
    }]
});

module.exports = mongoose.model("User", userSchema);
