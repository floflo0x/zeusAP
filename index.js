if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');

const cookieParser = require('cookie-parser');

const session = require('express-session');

const flash = require('connect-flash');

const axios = require('axios');

const FormData = require('form-data');

const authRoute = require("./routes/auth");

const userRoute = require("./routes/user");

const path = require("path");

const cors = require('cors');

const app = express();

app.set("view engine", "ejs");

app.set("views", "views");

app.set('trust proxy', true);

app.use(cookieParser());

app.use(session({
  secret: 'jefjwegj@!*&%^*%(1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

app.use(flash());

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600 // Cache preflight response for 1 hour
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.session.isLoggedIn = req.session.isLoggedIn || req.cookies._prod_isLoggedIn || 'false';
  next();
});

app.use(authRoute);

app.use(userRoute);

app.use('*', (req, res, next) => {
  return res.redirect("/login");
});

app.listen(4000, '0.0.0.0', () => {
  console.log("Listening to localhost port 4000...");
})