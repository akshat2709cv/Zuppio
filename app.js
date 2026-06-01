const createError = require("http-errors");
require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const authRouter = require("./routes/auth");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const { pages } = require("./services/siteData");
const { findUserById, publicUser } = require("./services/userStore");

const app = express();
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString("hex");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.locals.pages = pages;
app.disable("x-powered-by");

app.use(logger("dev"));
app.use(function (_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: "zuppio.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use(async function (req, res, next) {
  res.locals.currentUser = null;
  try {
    if (req.session.userId) {
      const user = await findUserById(req.session.userId);
      if (user) {
        res.locals.currentUser = publicUser(user);
      } else {
        delete req.session.userId;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/", authRouter);
app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use(function (_req, _res, next) {
  next(createError(404));
});

app.use(function (err, req, res, _next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error", {
    title: "Page Not Found",
    activePage: ""
  });
});

module.exports = app;
