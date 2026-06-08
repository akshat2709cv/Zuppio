const createError = require("http-errors");
require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const helmet = require("helmet");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");
const { adminLocals, csrfProtection } = require("./middleware/adminAuth");
const { ensureAdminUser, readState, recordVisit } = require("./services/adminStore");
const { pages } = require("./services/siteData");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.locals.pages = pages;
app.disable("x-powered-by");
ensureAdminUser().catch((error) => {
  console.error("Admin bootstrap failed:", error.message);
});

app.use(logger("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    strictTransportSecurity: false,
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://maps.googleapis.com", "https://maps.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        formAction: ["'self'"],
        scriptSrcAttr: ["'none'"]
      }
    }
  })
);
app.use(function (_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    name: "zuppio.sid",
    secret: process.env.SESSION_SECRET || "replace-this-session-secret-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);
app.use(adminLocals);
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", csrfProtection, adminRouter);
app.use(function (req, _res, next) {
  recordVisit(req).catch((error) => console.error("Visit tracking failed:", error.message));
  next();
});
app.use("/", indexRouter);

app.use(function (_req, _res, next) {
  next(createError(404));
});

app.use(async function (err, req, res, _next) {
  let adminState = null;
  try {
    adminState = await readState();
  } catch (error) {
    console.error("Error page CMS fallback failed:", error.message);
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error", {
    title: "Page Not Found",
    activePage: "",
    pages: adminState && adminState.header ? adminState.header.navItems : pages,
    siteHeader: adminState ? adminState.header : null,
    siteFooter: adminState ? adminState.footer : null
  });
});

module.exports = app;
