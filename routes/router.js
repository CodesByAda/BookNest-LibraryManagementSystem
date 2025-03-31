const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const bookRoutes = require("./bookRoutes");
const userRoutes = require("./userRoutes");
const adminRoutes = require("./adminRoutes");

router.use(authRoutes);
router.use(bookRoutes);
router.use(userRoutes);
router.use(adminRoutes);

module.exports = router;