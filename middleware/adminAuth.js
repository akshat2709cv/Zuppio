const crypto = require("crypto");
const { can } = require("../services/adminStore");

const attempts = new Map();

function adminLocals(req, res, next) {
  res.locals.adminUser = req.session ? req.session.adminUser : null;
  res.locals.csrfToken = req.session && req.path.startsWith("/admin") ? getCsrfToken(req) : "";
  next();
}

function getCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const supplied = req.body._csrf || req.get("X-CSRF-Token");
  if (supplied && supplied === getCsrfToken(req)) return next();
  return res.status(403).render("admin/login", {
    title: "Admin Login | ZUPPIO",
    error: "Security token expired. Please try again.",
    email: ""
  });
}

function loginRateLimit(req, res, next) {
  const key = req.ip || "unknown";
  const record = attempts.get(key) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
  if (Date.now() > record.resetAt) {
    record.count = 0;
    record.resetAt = Date.now() + 15 * 60 * 1000;
  }
  if (record.count >= 8) {
    return res.status(429).render("admin/login", {
      title: "Admin Login | ZUPPIO",
      error: "Too many login attempts. Please wait and try again.",
      email: ""
    });
  }
  req.loginAttemptRecord = record;
  attempts.set(key, record);
  next();
}

function registerFailedLogin(req) {
  if (req.loginAttemptRecord) req.loginAttemptRecord.count += 1;
}

function clearFailedLogins(req) {
  attempts.delete(req.ip || "unknown");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUser) return next();
  return res.redirect("/admin/login");
}

function requirePermission(permission) {
  return function (req, res, next) {
    const role = req.session && req.session.adminUser && req.session.adminUser.role;
    if (can(role, permission)) return next();
    return res.status(403).render("admin/forbidden", {
      title: "Forbidden | ZUPPIO Admin",
      active: permission
    });
  };
}

module.exports = {
  adminLocals,
  clearFailedLogins,
  csrfProtection,
  getCsrfToken,
  loginRateLimit,
  registerFailedLogin,
  requireAdmin,
  requirePermission
};
