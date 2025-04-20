require('dotenv').config();
require('./mailer/cron-jobs');
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const session = require("express-session");
const User = require("./models/user");
const Admin = require("./models/admin");
const flash = require("express-flash");
const MongoStore = require("connect-mongo");
const http = require("http");
const { initializeSocket } = require("./utils/socket");
const router = require("./routes/router");
const { errorMiddleware, notFoundMiddleware } = require("./middleware/errorMiddleware");

const app = express();
const port = 3000;
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

async function main() {
    //await mongoose.connect("mongodb://localhost:27017/LMS-MGMCET");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅Connected to MongoDB");
}

main().catch(err => console.error("❌MongoDB Connection Error:", err));




app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static('public/uploads'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(methodOverride("_method"));
app.use(flash());

// 🔹 Session setup (Persistent Login)
app.use(
    session({
        secret: "library_secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            //mongoUrl: "mongodb://localhost:27017/LMS-MGMCET",
            mongoUrl: process.env.MONGO_URL,
            collectionName: "sessions"
        }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1-week session
    })
);

// Middleware to make `io` available in all routes
app.use((req, res, next) => {
    req.io = require("./utils/socket"); // Attach socket utils to `req`
    next();
});

app.get("/", async (req, res) => {
    let user = null;  
    let admin = null;

    // Check if the user is logged in
    if (req.session.userId) {
        // First, check if the user is an admin
        admin = await Admin.findById(req.session.userId);
        
        // If not an admin, check if they are a student
        if (!admin) {
            user = await User.findById(req.session.userId);
        }
    }

    res.render("pages/index", { 
        session: req.session, 
        user, 
        admin 
    });
});


app.use(router);
//404 Errors
app.use(notFoundMiddleware);
//Global Errors
app.use(errorMiddleware);


const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Visit your Render URL to access the app.`);
  } else {
    console.log(`Local: http://localhost:${PORT}/`);
  }
});
