//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt')
const saltRounds = 10; // as recommended in the dox.
// const md5 = require('md5');
// const encrypt = require("mongoose-encryption");

const app = express();


const port = 3000;
var now = new Date();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// CONNECT to MONGOOSE, create a new database called userDB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// create a new schema called userSchema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// define a secret
// const secret = process.env.SECRET
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
//verify that this plugin is added before you create a mongoose model
// only the password is encrypted

// create a new mongoose model called User, based on the userSchema
// collection name is "User"
// specify the schema, userSchema
const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUser = new User({
      email: req.body.username,
      password: hash
    });
  
    newUser.save((err) => {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets"); // you can only see the secrets if you are registed and logged in
      }
    });
});
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        //if the user if found in the databse, do the following
        bcrypt.compare(password, foundUser.password, (err, result) => {
          if (result == true) {
            res.render("secrets");
            //if the password typed in at login matches the password in the database (foundUser.password) do the following
          }
      });
      }
    }
  });
});

app.listen(port, () => {
  console.log("Server is running on Port " + port + " on " + now.toUTCString());
});
