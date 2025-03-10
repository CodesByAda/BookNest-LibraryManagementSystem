const mongoose = require('mongoose');

const bookreqSchema = new mongoose.Schema({
    bookname: {
        type: String,
        required: true
    },
    authorname: {
        type: String,
        required: true
    },
    referenceLink: {
        type: String,
        required: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approved: {
        type: Boolean,
        default: false
    }
});

const Bookreq = mongoose.model('Bookreq', bookreqSchema);
module.exports = Bookreq;