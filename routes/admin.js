const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const {
  ROLES,
  addAudit,
  can,
  id,
  mutate,
  now,
  publicUser,
  readState
} = require("../services/adminStore");
const {
  clearFailedLogins,
  loginRateLimit,
  registerFailedLogin,
  requireAdmin,
  requirePermission
} = require("../middleware/adminAuth");

const router = express.Router();
const mediaDir = path.join(__dirname, "..", "public", "images", "admin-media");

const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDir,
    filename: function (_req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9. -]/gi, "").replace(/\s+/g, "-").toLowerCase()}`);
    }
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype)) return cb(null, true);
    return cb(new Error("Only image uploads are allowed."));
  }
});

const sections = [
  ["analytics", "Dashboard", "/admin"],
  ["content", "Homepage", "/admin/homepage"],
  ["content", "Header/Footer", "/admin/layout"],
  ["content", "Contact Page", "/admin/contact-page"],
  ["content", "About Page", "/admin/about-page"],
  ["content", "How To Buy", "/admin/how-to-buy-page"],
  ["content", "Policies", "/admin/policies-manager"],
  ["content", "CMS", "/admin/content"],
  ["products", "Products", "/admin/products"],
  ["categories", "Product Page Sections", "/admin/product-category-page"],
  ["categories", "Product Page Content", "/admin/product-categories-content"],
  ["categories", "Categories", "/admin/categories"],
  ["media", "Media", "/admin/media"],
  ["swiper", "Swiper Images", "/admin/swiper"],
  ["users", "Users", "/admin/users"],
  ["messages", "Messages", "/admin/messages"],
  ["blog", "Blog", "/admin/blog"],
  ["faqs", "FAQs", "/admin/faqs"],
  ["settings", "Settings", "/admin/settings"],
  ["settings", "SEO", "/admin/seo"],
  ["settings", "Backup", "/admin/backup"],
  ["audit", "Audit Logs", "/admin/audit"]
];

router.use(function (req, res, next) {
  res.locals.adminSections = sections.filter(([permission]) => req.session && req.session.adminUser && can(req.session.adminUser.role, permission));
  next();
});

router.get("/login", function (req, res) {
  if (req.session.adminUser) return res.redirect("/admin");
  res.render("admin/login", { title: "Admin Login | ZUPPIO", error: "", email: "" });
});

router.post("/login", loginRateLimit, async function (req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const state = await readState();
  const user = state.users.find((candidate) => candidate.email === email);

  if (!user || user.status !== "Active" || !(await bcrypt.compare(password, user.passwordHash))) {
    registerFailedLogin(req);
    await addAudit(email, "failed_login", "admin", req);
    return res.status(401).render("admin/login", { title: "Admin Login | ZUPPIO", error: "Invalid admin credentials.", email });
  }

  req.session.regenerate(async function (error) {
    if (error) throw error;
    req.session.adminUser = publicUser({ ...user, passwordHash: undefined });
    clearFailedLogins(req);
    await mutate((draft) => {
      const matched = draft.users.find((candidate) => candidate.id === user.id);
      if (matched) matched.lastLoginAt = now();
    });
    await addAudit(email, "login", "admin", req);
    res.redirect("/admin");
  });
});

router.post("/logout", requireAdmin, async function (req, res) {
  const actor = req.session.adminUser.email;
  await addAudit(actor, "logout", "admin", req);
  req.session.destroy(function () {
    res.clearCookie("zuppio.sid");
    res.redirect("/admin/login");
  });
});

router.use(requireAdmin);

router.get("/", requirePermission("analytics"), async function (_req, res) {
  const state = await readState();
  res.render("admin/dashboard", {
    title: "Dashboard | ZUPPIO Admin",
    active: "analytics",
    state
  });
});

function text(value) {
  return String(value || "").trim().slice(0, 5000);
}

function csv(value) {
  return text(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ""));
  } catch (_error) {
    return fallback;
  }
}

async function renderJsonManager(res, title, active, key, help) {
  const state = await readState();
  res.render("admin/json-manager", {
    title,
    active,
    key,
    help,
    value: JSON.stringify(state[key], null, 2),
    message: ""
  });
}

function saveJsonManager(key, action) {
  return async function (req, res) {
    let saved = true;
    await mutate((state) => {
      const parsed = parseJson(req.body.value, null);
      if (!parsed) {
        saved = false;
        return;
      }
      state[key] = parsed;
    });
    if (saved) await addAudit(req.session.adminUser.email, action, key, req);
    const state = await readState();
    res.render("admin/json-manager", {
      title: `${key} | ZUPPIO Admin`,
      active: "content",
      key,
      help: "Edit the JSON carefully. Changes are saved to data/admin.json and appear on the public website after refresh.",
      value: JSON.stringify(state[key], null, 2),
      message: saved ? "Saved successfully." : "Invalid JSON. Nothing was saved."
    });
  };
}

router.get("/homepage", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Homepage Manager | ZUPPIO Admin", "content", "homepage", "Controls home hero, feature cards, category marquee, testimonials, FAQ, and newsletter text.");
});

router.post("/homepage", requirePermission("content"), saveJsonManager("homepage", "homepage_update"));

router.get("/product-categories-content", requirePermission("categories"), async function (_req, res) {
  await renderJsonManager(res, "Product Categories Page Content | ZUPPIO Admin", "categories", "productCategories", "Controls live category cards, category icons, summaries, statuses, and products inside each category.");
});

router.post("/product-categories-content", requirePermission("categories"), saveJsonManager("productCategories", "product_categories_content_update"));

router.get("/product-category-page", requirePermission("categories"), async function (_req, res) {
  await renderJsonManager(res, "Product Category Page Sections | ZUPPIO Admin", "categories", "productCategoryPage", "Controls category page headings, non-banner swiper slides, and business enquiry panel.");
});

router.post("/product-category-page", requirePermission("categories"), saveJsonManager("productCategoryPage", "product_category_page_update"));

router.get("/layout", requirePermission("content"), async function (_req, res) {
  const state = await readState();
  res.render("admin/layout-manager", {
    title: "Header/Footer Manager | ZUPPIO Admin",
    active: "content",
    state,
    message: ""
  });
});

router.post("/layout", requirePermission("content"), async function (req, res) {
  await mutate((state) => {
    state.header.logo = text(req.body.logo);
    state.footer.brandText = text(req.body.brandText);
    state.footer.phone = text(req.body.phone);
    state.footer.email = text(req.body.email);
    state.footer.whatsappLink = text(req.body.whatsappLink);
    state.footer.copyrightText = text(req.body.copyrightText);
    state.header.navItems = parseJson(req.body.navItems, state.header.navItems);
    state.footer.exploreLinks = parseJson(req.body.exploreLinks, state.footer.exploreLinks);
    state.footer.socialLinks = parseJson(req.body.socialLinks, state.footer.socialLinks);
  });
  await addAudit(req.session.adminUser.email, "layout_update", "header_footer", req);
  const state = await readState();
  res.render("admin/layout-manager", { title: "Header/Footer Manager | ZUPPIO Admin", active: "content", state, message: "Saved successfully." });
});

router.get("/contact-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Contact Page Manager | ZUPPIO Admin", "content", "contactPage", "Controls contact hero, company details, social cards, QR cards, and form heading.");
});

router.post("/contact-page", requirePermission("content"), saveJsonManager("contactPage", "contact_page_update"));

router.get("/about-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "About Page Manager | ZUPPIO Admin", "content", "aboutPage", "Controls About intro, Who We Are, feature cards, story, mission, vision, and values.");
});

router.post("/about-page", requirePermission("content"), saveJsonManager("aboutPage", "about_page_update"));

router.get("/how-to-buy-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "How To Buy Manager | ZUPPIO Admin", "content", "howToBuyPage", "Controls wholesale benefits and dealer inquiry form fields.");
});

router.post("/how-to-buy-page", requirePermission("content"), saveJsonManager("howToBuyPage", "how_to_buy_update"));

router.get("/policies-manager", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Policies Manager | ZUPPIO Admin", "content", "policies", "Controls terms cards and policy detail pages.");
});

router.post("/policies-manager", requirePermission("content"), saveJsonManager("policies", "policies_update"));

router.get("/seo", requirePermission("settings"), async function (_req, res) {
  await renderJsonManager(res, "SEO Manager | ZUPPIO Admin", "settings", "seo", "Controls meta title, description, OG image, canonical URL, and noindex per page.");
});

router.post("/seo", requirePermission("settings"), saveJsonManager("seo", "seo_update"));

router.get("/backup", requirePermission("settings"), async function (_req, res) {
  res.render("admin/backup", {
    title: "Backup | ZUPPIO Admin",
    active: "settings",
    message: ""
  });
});

router.get("/backup/export", requirePermission("settings"), async function (_req, res) {
  const state = await readState();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=\"zuppio-admin-backup-${Date.now()}.json\"`);
  res.send(JSON.stringify(state, null, 2));
});

router.post("/backup/restore", requirePermission("settings"), async function (req, res) {
  const restored = parseJson(req.body.backup, null);
  if (!restored) {
    return res.render("admin/backup", { title: "Backup | ZUPPIO Admin", active: "settings", message: "Invalid JSON backup. Nothing was restored." });
  }
  await mutate((state) => {
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, restored);
  });
  await addAudit(req.session.adminUser.email, "backup_restore", "admin_json", req);
  res.render("admin/backup", { title: "Backup | ZUPPIO Admin", active: "settings", message: "Backup restored successfully." });
});

function csvEscape(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

router.get("/backup/subscribers.csv", requirePermission("settings"), async function (_req, res) {
  const state = await readState();
  const rows = [["email", "status", "createdAt"]].concat((state.submissions.newsletter || state.subscribers || []).map((item) => [item.email, item.status, item.createdAt]));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"zuppio-subscribers.csv\"");
  res.send(rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
});

router.get("/backup/inquiries.csv", requirePermission("settings"), async function (_req, res) {
  const state = await readState();
  const contacts = (state.submissions.contacts || []).map((item) => [item.name, item.email, "", "", item.message, item.status, item.createdAt]);
  const dealers = (state.submissions.dealerInquiries || []).map((item) => [item.name, "", item.phone, item.city, `${item.shop || ""} ${item.business || ""} ${item.quantity || ""}`.trim(), item.status, item.createdAt]);
  const rows = [["name", "email", "phone", "city", "message", "status", "createdAt"]].concat(contacts, dealers);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"zuppio-inquiries.csv\"");
  res.send(rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
});

router.get("/content", requirePermission("content"), async function (_req, res) {
  res.render("admin/manage", { title: "CMS | ZUPPIO Admin", active: "content", state: await readState(), kind: "content" });
});

router.post("/content/:id", requirePermission("content"), async function (req, res) {
  await mutate((state) => {
    const item = state.content.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { title: text(req.body.title), body: text(req.body.body), status: text(req.body.status) || "draft" });
  });
  await addAudit(req.session.adminUser.email, "content_update", req.params.id, req);
  res.redirect("/admin/content");
});

router.get("/products", requirePermission("products"), async function (_req, res) {
  res.render("admin/manage", { title: "Products | ZUPPIO Admin", active: "products", state: await readState(), kind: "products" });
});

router.post("/products", requirePermission("products"), async function (req, res) {
  await mutate((state) => {
    state.products.unshift({
      id: id("product"),
      name: text(req.body.name),
      flavour: text(req.body.flavour),
      price: text(req.body.price),
      packetSize: text(req.body.packetSize),
      category: text(req.body.category),
      description: text(req.body.description),
      images: csv(req.body.images),
      availability: text(req.body.availability) || "Available",
      offers: text(req.body.offers),
      status: text(req.body.status) || "Active"
    });
  });
  await addAudit(req.session.adminUser.email, "product_create", req.body.name, req);
  res.redirect("/admin/products");
});

router.post("/products/:id", requirePermission("products"), async function (req, res) {
  await mutate((state) => {
    const item = state.products.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, {
      name: text(req.body.name),
      flavour: text(req.body.flavour),
      price: text(req.body.price),
      packetSize: text(req.body.packetSize),
      category: text(req.body.category),
      description: text(req.body.description),
      images: csv(req.body.images),
      availability: text(req.body.availability),
      offers: text(req.body.offers),
      status: text(req.body.status)
    });
  });
  await addAudit(req.session.adminUser.email, "product_update", req.params.id, req);
  res.redirect("/admin/products");
});

router.post("/products/:id/delete", requirePermission("products"), async function (req, res) {
  await mutate((state) => {
    state.products = state.products.filter((entry) => entry.id !== req.params.id);
  });
  await addAudit(req.session.adminUser.email, "product_delete", req.params.id, req);
  res.redirect("/admin/products");
});

router.get("/categories", requirePermission("categories"), async function (_req, res) {
  res.render("admin/manage", { title: "Categories | ZUPPIO Admin", active: "categories", state: await readState(), kind: "categories" });
});

router.post("/categories", requirePermission("categories"), async function (req, res) {
  await mutate((state) => {
    state.categories.unshift({ id: id("category"), name: text(req.body.name), tags: csv(req.body.tags), flavour: text(req.body.flavour), size: text(req.body.size), colour: text(req.body.colour), variations: text(req.body.variations), productType: text(req.body.productType), status: text(req.body.status) });
  });
  await addAudit(req.session.adminUser.email, "category_create", req.body.name, req);
  res.redirect("/admin/categories");
});

router.post("/categories/:id", requirePermission("categories"), async function (req, res) {
  await mutate((state) => {
    const item = state.categories.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { name: text(req.body.name), tags: csv(req.body.tags), flavour: text(req.body.flavour), size: text(req.body.size), colour: text(req.body.colour), variations: text(req.body.variations), productType: text(req.body.productType), status: text(req.body.status) });
  });
  await addAudit(req.session.adminUser.email, "category_update", req.params.id, req);
  res.redirect("/admin/categories");
});

router.get("/media", requirePermission("media"), async function (_req, res) {
  res.render("admin/manage", { title: "Media | ZUPPIO Admin", active: "media", state: await readState(), kind: "media" });
});

router.post("/media", requirePermission("media"), upload.single("media"), async function (req, res) {
  if (!req.file) return res.redirect("/admin/media");
  const publicPath = `/images/admin-media/${req.file.filename}`;
  await mutate((state) => {
    state.media.unshift({ id: id("media"), name: text(req.body.name) || req.file.originalname, url: publicPath, type: req.file.mimetype, size: req.file.size, createdAt: now() });
  });
  await addAudit(req.session.adminUser.email, "media_upload", publicPath, req);
  res.redirect("/admin/media");
});

router.post("/media/:id/delete", requirePermission("media"), async function (req, res) {
  await mutate((state) => {
    state.media = state.media.filter((entry) => entry.id !== req.params.id);
  });
  await addAudit(req.session.adminUser.email, "media_delete", req.params.id, req);
  res.redirect("/admin/media");
});

router.get("/swiper", requirePermission("swiper"), async function (_req, res) {
  res.render("admin/manage", { title: "Swiper Images | ZUPPIO Admin", active: "swiper", state: await readState(), kind: "swiper" });
});

router.post("/swiper/:id", requirePermission("swiper"), async function (req, res) {
  await mutate((state) => {
    const item = state.swiperSlides.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { title: text(req.body.title), desktopImage: text(req.body.desktopImage), tabletImage: text(req.body.tabletImage), mobileImage: text(req.body.mobileImage), alt: text(req.body.alt), status: text(req.body.status) || "Active" });
  });
  await addAudit(req.session.adminUser.email, "swiper_update", req.params.id, req);
  res.redirect("/admin/swiper");
});

router.get("/users", requirePermission("users"), async function (_req, res) {
  res.render("admin/manage", { title: "Users | ZUPPIO Admin", active: "users", state: await readState(), kind: "users", roles: Object.keys(ROLES) });
});

router.post("/users", requirePermission("users"), async function (req, res) {
  const password = String(req.body.password || "");
  if (password.length < 10) return res.redirect("/admin/users");
  await mutate(async (state) => {
    state.users.unshift({ id: id("user"), name: text(req.body.name), email: text(req.body.email).toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: text(req.body.role) || "Viewer", status: text(req.body.status) || "Active", createdAt: now(), lastLoginAt: "" });
  });
  await addAudit(req.session.adminUser.email, "user_create", req.body.email, req);
  res.redirect("/admin/users");
});

router.post("/users/:id", requirePermission("users"), async function (req, res) {
  await mutate(async (state) => {
    const item = state.users.find((entry) => entry.id === req.params.id);
    if (!item) return;
    Object.assign(item, { name: text(req.body.name), role: text(req.body.role), status: text(req.body.status) });
    if (String(req.body.password || "").length >= 10) item.passwordHash = await bcrypt.hash(String(req.body.password), 12);
  });
  await addAudit(req.session.adminUser.email, "user_update", req.params.id, req);
  res.redirect("/admin/users");
});

router.get("/messages", requirePermission("messages"), async function (_req, res) {
  res.render("admin/manage", { title: "Messages | ZUPPIO Admin", active: "messages", state: await readState(), kind: "messages" });
});

router.post("/messages/:type/:id", requirePermission("messages"), async function (req, res) {
  await mutate((state) => {
    const list = req.params.type === "feedback" ? state.feedback : state.inquiries;
    const item = list.find((entry) => entry.id === req.params.id);
    if (item) item.status = text(req.body.status);
  });
  await addAudit(req.session.adminUser.email, "message_update", req.params.id, req);
  res.redirect("/admin/messages");
});

router.get("/blog", requirePermission("blog"), async function (_req, res) {
  res.render("admin/manage", { title: "Blog | ZUPPIO Admin", active: "blog", state: await readState(), kind: "blog" });
});

router.post("/blog", requirePermission("blog"), async function (req, res) {
  await mutate((state) => {
    state.blogPosts.unshift({ id: id("blog"), title: text(req.body.title), slug: text(req.body.slug), description: text(req.body.description), category: text(req.body.category), tags: csv(req.body.tags), image: text(req.body.image), status: text(req.body.status) || "Draft", seoTitle: text(req.body.seoTitle), seoDescription: text(req.body.seoDescription) });
  });
  await addAudit(req.session.adminUser.email, "blog_create", req.body.title, req);
  res.redirect("/admin/blog");
});

router.post("/blog/:id", requirePermission("blog"), async function (req, res) {
  await mutate((state) => {
    const item = state.blogPosts.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { title: text(req.body.title), slug: text(req.body.slug), description: text(req.body.description), category: text(req.body.category), tags: csv(req.body.tags), image: text(req.body.image), status: text(req.body.status), seoTitle: text(req.body.seoTitle), seoDescription: text(req.body.seoDescription) });
  });
  await addAudit(req.session.adminUser.email, "blog_update", req.params.id, req);
  res.redirect("/admin/blog");
});

router.post("/blog/:id/delete", requirePermission("blog"), async function (req, res) {
  await mutate((state) => {
    state.blogPosts = state.blogPosts.filter((entry) => entry.id !== req.params.id);
  });
  await addAudit(req.session.adminUser.email, "blog_delete", req.params.id, req);
  res.redirect("/admin/blog");
});

router.get("/faqs", requirePermission("faqs"), async function (_req, res) {
  res.render("admin/manage", { title: "FAQs | ZUPPIO Admin", active: "faqs", state: await readState(), kind: "faqs" });
});

router.post("/faqs", requirePermission("faqs"), async function (req, res) {
  await mutate((state) => {
    state.faqs.push({ id: id("faq"), question: text(req.body.question), answer: text(req.body.answer), order: Number(req.body.order) || state.faqs.length + 1 });
    state.faqs.sort((a, b) => a.order - b.order);
  });
  await addAudit(req.session.adminUser.email, "faq_create", req.body.question, req);
  res.redirect("/admin/faqs");
});

router.post("/faqs/:id", requirePermission("faqs"), async function (req, res) {
  await mutate((state) => {
    const item = state.faqs.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { question: text(req.body.question), answer: text(req.body.answer), order: Number(req.body.order) || item.order });
    state.faqs.sort((a, b) => a.order - b.order);
  });
  await addAudit(req.session.adminUser.email, "faq_update", req.params.id, req);
  res.redirect("/admin/faqs");
});

router.get("/settings", requirePermission("settings"), async function (_req, res) {
  res.render("admin/manage", { title: "Settings | ZUPPIO Admin", active: "settings", state: await readState(), kind: "settings" });
});

router.post("/settings", requirePermission("settings"), async function (req, res) {
  await mutate((state) => {
    Object.keys(state.settings).forEach((key) => {
      state.settings[key] = text(req.body[key]);
    });
  });
  await addAudit(req.session.adminUser.email, "settings_update", "site", req);
  res.redirect("/admin/settings");
});

router.get("/audit", requirePermission("audit"), async function (_req, res) {
  res.render("admin/manage", { title: "Audit Logs | ZUPPIO Admin", active: "audit", state: await readState(), kind: "audit" });
});

router.get("/api/analytics", requirePermission("analytics"), async function (_req, res) {
  const state = await readState();
  res.json({ analytics: state.analytics, totals: { inquiries: state.inquiries.length, feedback: state.feedback.length, subscribers: state.subscribers.length, products: state.products.length } });
});

module.exports = router;
