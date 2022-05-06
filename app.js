//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const bcrypt = require('bcrypt')
// const saltRounds = 10; // as recommended in the dox.
// const md5 = require('md5');
// const encrypt = require("mongoose-encryption");

const app = express();


const port = 3000;
var now = new Date();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


const secret = process.env.SECRET
// session
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
    // cookie: { secure: true } // this was causing issues, redirecting to /login instead of /secret and deauthenticating
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

// CONNECT to MONGOOSE, create a new database called userDB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// create a new schema called userSchema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// this will hash and salt the passwords and save the users in MongoDB userDB database
userSchema.plugin(passportLocalMongoose);

// this is needed as part of the findOrCreate package.
userSchema.plugin(findOrCreate)

// define a secret
// const secret = process.env.SECRET
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
//verify that this plugin is added before you create a mongoose model
// only the password is encrypted

// create a new mongoose model called User, based on the userSchema
// collection name is "User"
// specify the schema, userSchema
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/"+process.env.CALLBACKURL
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// this will check to see if the user is authenticated
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout",  (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {

  User.register({username: req.body.username}, req.body.password, (err, user) =>{
    if (err) {
      console.log(err)
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  });  
});

app.post("/login", (req, res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  })
});

app.listen(port, () => {
  console.log("Server is running on Port " + port + " on " + now.toUTCString());
});
