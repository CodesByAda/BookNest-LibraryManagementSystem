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

    profilePic: String,

    borrowedBooks: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        dueDate: { type: Date, required: true }
    }]
});

module.exports = mongoose.model("User", userSchema);
