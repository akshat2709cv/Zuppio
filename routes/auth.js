const crypto = require("crypto");
const express = require("express");
const { pages } = require("../services/siteData");
const {
  createUser,
  findUserByEmail,
  publicUser,
  verifyPassword
} = require("../services/userStore");

const router = express.Router();
const loginAttempts = new Map();
const attemptWindowMs = 15 * 60 * 1000;
const maxAttempts = 5;

function csrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

function csrfMatches(req) {
  const token = String(req.body._csrf || "");
  return Boolean(req.session.csrfToken && token && token === req.session.csrfToken);
}

function renderAuth(res, view, title, extra = {}) {
  res.render(view, {
    title,
    activePage: "Account",
    pages,
    ...extra
  });
}

function attemptKey(req, email) {
  return `${req.ip}:${String(email || "").toLowerCase()}`;
}

function cleanAttempts(key) {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) || []).filter((time) => now - time < attemptWindowMs);
  loginAttempts.set(key, attempts);
  return attempts;
}

function isRateLimited(key) {
  return cleanAttempts(key).length >= maxAttempts;
}

function recordFailedAttempt(key) {
  const attempts = cleanAttempts(key);
  attempts.push(Date.now());
  loginAttempts.set(key, attempts);
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

function requireAuth(req, res, next) {
  if (res.locals.currentUser) return next();
  return res.redirect("/login");
}

function loginUser(req, user, callback) {
  req.session.regenerate((error) => {
    if (error) return callback(error);
    req.session.userId = user.id;
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    req.session.save(callback);
  });
}

router.get("/login", function (req, res) {
  if (res.locals.currentUser) return res.redirect("/account");
  return renderAuth(res, "auth/login", "Login | ZUPPIO", {
    csrfToken: csrfToken(req),
    form: { email: "" }
  });
});

router.post("/login", async function (req, res, next) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const key = attemptKey(req, email);

  if (!csrfMatches(req)) {
    return renderAuth(res.status(403), "auth/login", "Login | ZUPPIO", {
      csrfToken: csrfToken(req),
      error: "Security check failed. Please refresh and try again.",
      form: { email }
    });
  }

  if (isRateLimited(key)) {
    return renderAuth(res.status(429), "auth/login", "Login | ZUPPIO", {
      csrfToken: csrfToken(req),
      error: "Too many login attempts. Please try again after a few minutes.",
      form: { email }
    });
  }

  try {
    const user = await findUserByEmail(email);
    const isValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!isValid) {
      recordFailedAttempt(key);
      return renderAuth(res.status(401), "auth/login", "Login | ZUPPIO", {
        csrfToken: csrfToken(req),
        error: "Email or password is incorrect.",
        form: { email }
      });
    }

    clearAttempts(key);
    return loginUser(req, user, (error) => {
      if (error) return next(error);
      return res.redirect("/account");
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/register", function (req, res) {
  if (res.locals.currentUser) return res.redirect("/account");
  return renderAuth(res, "auth/register", "Create Account | ZUPPIO", {
    csrfToken: csrfToken(req),
    form: { name: "", email: "" }
  });
});

router.post("/register", async function (req, res, next) {
  const form = {
    name: String(req.body.name || "").trim(),
    email: String(req.body.email || "").trim().toLowerCase()
  };
  const password = String(req.body.password || "");

  if (!csrfMatches(req)) {
    return renderAuth(res.status(403), "auth/register", "Create Account | ZUPPIO", {
      csrfToken: csrfToken(req),
      error: "Security check failed. Please refresh and try again.",
      form
    });
  }

  try {
    const user = await createUser({ ...form, password });
    return loginUser(req, user, (error) => {
      if (error) return next(error);
      return res.redirect("/account");
    });
  } catch (error) {
    if (["INVALID_NAME", "INVALID_EMAIL", "WEAK_PASSWORD", "EMAIL_EXISTS"].includes(error.code)) {
      return renderAuth(res.status(422), "auth/register", "Create Account | ZUPPIO", {
        csrfToken: csrfToken(req),
        error: error.message,
        form
      });
    }
    return next(error);
  }
});

router.get("/account", requireAuth, function (req, res) {
  return renderAuth(res, "account", "My Account | ZUPPIO", {
    csrfToken: csrfToken(req),
    accountUser: publicUser(res.locals.currentUser)
  });
});

router.post("/logout", requireAuth, function (req, res) {
  if (!csrfMatches(req)) return res.status(403).redirect("/account");

  req.session.destroy(function () {
    res.clearCookie("zuppio.sid");
    res.redirect("/");
  });
});

module.exports = router;
