//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const port = 3000;
var now = new Date();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// CONNECT to MONGOOSE, create a new database called userDB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// create a new schema called userSchema
const userSchema = {
    email: String,
    password: String
};

// create a new mongoose model called User, based on the userSchema
// collection name is "User"
// specify the schema, userSchema
const user = new mongoose.model("User", userSchema);


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.listen(port, () => {
  console.log("Server is running on Port " + port + " on " + now.toUTCString());
});
