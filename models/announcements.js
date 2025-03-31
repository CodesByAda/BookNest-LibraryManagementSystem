const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },   // ✅ Include virtuals when converting to JSON
    toObject: { virtuals: true }  // ✅ Include virtuals when converting to Object
});

// Virtual field for formatted date (e.g., "March 10, 2025")
announcementSchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
