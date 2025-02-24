const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");

const app = express();
const port = 8080;

main()
    .then(() => console.log("Connected to MongoDB."))
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/LMS-MGMCET");
}

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", (req,res) => {
    res.render("pages/index");
})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});