//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

const port = 3000;
var now = new Date();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const secret = process.env.SECRET;

// session
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true } // this was causing issues, redirecting to /login instead of /secret and deauthenticating
  })
);

// passport
app.use(passport.initialize());
app.use(passport.session());

// CONNECT to MONGOOSE, create a new database called userDB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// create a new schema called userSchema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

// this will hash and salt the passwords and save the users in MongoDB userDB database
userSchema.plugin(passportLocalMongoose);

// this is needed as part of the findOrCreate package.
userSchema.plugin(findOrCreate);

// create a new mongoose model called User, based on the userSchema
// collection name is "User"
// specify the schema, userSchema
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/" + process.env.CALLBACKURL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

// use passport to authenticate the google strategy, needing their google profile, including thier user id
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// this should allow a google user id to login and see the secrets page.
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// this will check to see if the user is authenticated
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
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
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(port, () => {
  console.log("Server is running on Port " + port + " on " + now.toUTCString());
});
