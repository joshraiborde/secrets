//jshint esversion:6

const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
require("dotenv").config()

const app = express();

const port = 3000;
var now = new Date();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));




app.listen(port, () => {
    console.log("Server is running on Port " + port + " on " + now.toUTCString());
  });
  