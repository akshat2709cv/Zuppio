const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
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
  loginViewData,
  loginRateLimit,
  multipartCsrfProtection,
  registerFailedLogin,
  requireAdmin,
  requirePermission
} = require("../middleware/adminAuth");

const router = express.Router();
const mediaDir = path.join(__dirname, "..", "public", "uploads", "cms");
const uploadPublicBase = "/uploads/cms";
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);
const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

fs.mkdirSync(mediaDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDir,
    filename: function (_req, file, cb) {
      const extension = path.extname(file.originalname).toLowerCase();
      const basename = path.basename(file.originalname, extension)
        .replace(/[^a-z0-9-]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "cms-image";
      cb(null, `${Date.now()}-${id("image").replace(/^image_/, "")}-${basename}${extension}`);
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedImageExtensions.has(extension) && allowedImageMimeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Only jpg, jpeg, png, webp, and svg image uploads are allowed."));
  }
});

const sections = [
  { permission: "analytics", id: "dashboard", label: "Dashboard", href: "/admin" },
  { permission: "content", id: "homepage", label: "Homepage", href: "/admin/homepage" },
  { permission: "content", id: "layout", label: "Header / Footer", href: "/admin/layout" },
  { permission: "categories", id: "product-categories", label: "Product Categories Page", href: "/admin/product-categories-content" },
  { permission: "categories", id: "product-category-pages", label: "Product Categories Slider", href: "/admin/product-category-page" },
  { permission: "products", id: "products", label: "Products", href: "/admin/products" },
  { permission: "content", id: "how-to-buy", label: "How To Buy / Store Locator", href: "/admin/how-to-buy-page" },
  { permission: "content", id: "about", label: "About Page", href: "/admin/about-page" },
  { permission: "content", id: "contact", label: "Contact Page", href: "/admin/contact-page" },
  { permission: "blog", id: "blog-page", label: "Blog Page Header", href: "/admin/blog-page" },
  { permission: "blog", id: "blogs", label: "Blogs", href: "/admin/blog" },
  { permission: "faqs", id: "faqs", label: "FAQ Manager", href: "/admin/faqs" },
  { permission: "content", id: "policies", label: "Policies / Terms", href: "/admin/policies-manager" },
  { permission: "media", id: "media", label: "Media Manager", href: "/admin/media" },
  { permission: "settings", id: "seo", label: "SEO Settings", href: "/admin/seo" },
  { permission: "messages", id: "messages", label: "Inquiries / Submissions", href: "/admin/messages" },
  { permission: "messages", id: "newsletter", label: "Newsletter Subscribers", href: "/admin/newsletter" },
  { permission: "analytics", id: "analytics", label: "Analytics", href: "/admin/analytics" },
  { permission: "users", id: "users", label: "Users", href: "/admin/users" },
  { permission: "settings", id: "backup", label: "Backup / Export", href: "/admin/backup" },
  { permission: "settings", id: "settings", label: "Settings", href: "/admin/settings" }
];

router.use(function (req, res, next) {
  res.locals.adminSections = sections.filter((item) => req.session && req.session.adminUser && can(req.session.adminUser.role, item.permission));
  next();
});

router.get("/login", function (req, res) {
  if (req.session.adminUser) return res.redirect("/admin");
  res.render("admin/login", loginViewData(req));
});

router.post("/login", loginRateLimit, async function (req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const state = await readState();
  const user = state.users.find((candidate) => candidate.email === email);

  if (!user || user.status !== "Active" || !(await bcrypt.compare(password, user.passwordHash))) {
    registerFailedLogin(req);
    await addAudit(email, "failed_login", "admin", req);
    return res.status(401).render("admin/login", loginViewData(req, { error: "Invalid admin credentials.", email }));
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
    active: "dashboard",
    state
  });
});

function text(value) {
  return String(value || "").trim().slice(0, 5000);
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, fallback, min, max) {
  return Math.max(min, Math.min(max, number(value, fallback)));
}

function csv(value) {
  return text(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function imageUrl(value) {
  const url = text(value).slice(0, 1000);
  return /^(\/images\/|\/uploads\/cms\/|https?:\/\/)/i.test(url) ? url : "";
}

function filesFromRequest(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
}

function firstFile(req, fieldName) {
  return filesFromRequest(req).find((file) => file.fieldname === fieldName);
}

function uploadedPublicPath(file) {
  return file ? `${uploadPublicBase}/${file.filename}` : "";
}

function uploadedPublicPaths(files) {
  return (Array.isArray(files) ? files : []).map(uploadedPublicPath).filter(Boolean);
}

function assignJsonPath(root, pathValue, value) {
  const parts = String(pathValue || "").split(".").filter(Boolean);
  if (!parts.length) return;

  let cursor = root;
  parts.forEach((part, index) => {
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const nextPart = parts[index + 1];
    if (index === parts.length - 1) {
      cursor[key] = value;
      return;
    }
    if (cursor[key] === undefined || cursor[key] === null) {
      cursor[key] = /^\d+$/.test(nextPart) ? [] : {};
    }
    cursor = cursor[key];
  });
}

function uploadFieldMap(req) {
  return new Map(asArray(req.body.cmsImageUpload).map((item) => {
    const [fieldName, pathValue] = String(item || "").split("|");
    return [fieldName, pathValue];
  }).filter(([fieldName, pathValue]) => fieldName && pathValue));
}

function slidePayload(req, existing = {}, uploadedPath = "") {
  const backgroundImage = uploadedPath || imageUrl(req.body.backgroundImage) || existing.backgroundImage || "";
  const title = text(req.body.title) || existing.title || "Product slide";

  return {
    label: text(req.body.label),
    title,
    text: text(req.body.text),
    buttonText: text(req.body.buttonText) || "Explore",
    buttonLink: text(req.body.buttonLink) || "/product-categories",
    backgroundImage,
    mobileBackgroundImage: imageUrl(req.body.mobileBackgroundImage) || existing.mobileBackgroundImage || existing.mobileImage || "",
    overlayStrength: clamp(req.body.overlayStrength, existing.overlayStrength || 0.58, 0.18, 0.85),
    order: number(req.body.order, existing.order || 1),
    status: text(req.body.status) || "Active",
    className: existing.className || "managed-slide",
    images: existing.images || [],
    artClass: existing.artClass || ""
  };
}

function recordUploadedMedia(state, req, publicPath, file, name) {
  const uploadFile = file || req.file;
  if (!publicPath || !uploadFile) return;
  state.media.unshift({
    id: id("media"),
    name: text(name || req.body.mediaName || req.body.name || req.body.title || uploadFile.originalname) || uploadFile.originalname,
    url: publicPath,
    type: uploadFile.mimetype,
    size: uploadFile.size,
    createdAt: now()
  });
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ""));
  } catch (_error) {
    return fallback;
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function activeForJsonKey(key) {
  return {
    homepage: "homepage",
    productCategories: "product-categories",
    productCategoryPage: "product-category-pages",
    contactPage: "contact",
    aboutPage: "about",
    blogPage: "blog-page",
    howToBuy: "how-to-buy",
    howToBuyPage: "how-to-buy",
    policies: "policies",
    seo: "seo"
  }[key] || "homepage";
}

function routeForJsonKey(key) {
  return {
    homepage: "/admin/homepage",
    productCategories: "/admin/product-categories-content",
    productCategoryPage: "/admin/product-category-page",
    contactPage: "/admin/contact-page",
    aboutPage: "/admin/about-page",
    blogPage: "/admin/blog-page",
    howToBuy: "/admin/how-to-buy-page",
    howToBuyPage: "/admin/how-to-buy-page",
    policies: "/admin/policies-manager",
    seo: "/admin/seo"
  }[key] || `/admin/${key}`;
}

async function renderJsonManager(res, title, active, key, help) {
  const state = await readState();
  res.render("admin/json-manager", {
    title,
    active,
    key,
    help,
    formAction: routeForJsonKey(key),
    data: state[key] || {},
    value: JSON.stringify(state[key], null, 2),
    message: ""
  });
}

function saveJsonManager(key, action) {
  return async function (req, res) {
    let saved = true;
    const cmsUploads = uploadFieldMap(req);
    const files = filesFromRequest(req);
    await mutate((state) => {
      const parsed = parseJson(req.body.value, null);
      if (!parsed) {
        saved = false;
        return;
      }
      files.forEach((file) => {
        const pathValue = cmsUploads.get(file.fieldname);
        if (!pathValue) return;
        const publicPath = uploadedPublicPath(file);
        assignJsonPath(parsed, pathValue, publicPath);
        recordUploadedMedia(state, req, publicPath, file, `${key} ${pathValue}`);
      });
      state[key] = parsed;
    });
    if (saved) await addAudit(req.session.adminUser.email, action, key, req);
    const state = await readState();
    res.render("admin/json-manager", {
      title: `${key} | ZUPPIO Admin`,
      active: activeForJsonKey(key),
      key,
      help: "Edit these CMS fields. Changes are saved to data/admin.json and appear on the public website after refresh.",
      formAction: routeForJsonKey(key),
      data: state[key] || {},
      value: JSON.stringify(state[key], null, 2),
      message: saved ? "Saved successfully." : "Invalid JSON. Nothing was saved."
    });
  };
}

router.get("/homepage", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Homepage Manager | ZUPPIO Admin", "homepage", "homepage", "Controls home hero, responsive hero backgrounds, feature cards, product category slider cards, testimonials, FAQ, and newsletter text. For Product Categories card images, upload 1200 x 800 px WebP/JPG for best quality.");
});

router.post("/homepage", requirePermission("content"), upload.any(), multipartCsrfProtection, saveJsonManager("homepage", "homepage_update"));

router.get("/product-categories-content", requirePermission("categories"), async function (_req, res) {
  await renderJsonManager(res, "Product Categories Page Content | ZUPPIO Admin", "product-categories", "productCategories", "Controls live category cards, category icons, summaries, statuses, and products inside each category.");
});

router.post("/product-categories-content", requirePermission("categories"), upload.any(), multipartCsrfProtection, saveJsonManager("productCategories", "product_categories_content_update"));

router.get("/product-category-page", requirePermission("categories"), async function (_req, res) {
  res.render("admin/manage", { title: "Product Slider | ZUPPIO Admin", active: "product-category-pages", state: await readState(), kind: "product-category-page" });
});

router.post("/product-category-page", requirePermission("categories"), async function (req, res) {
  await mutate((state) => {
    state.productCategoryPage.overview = {
      label: text(req.body.overviewLabel) || "Categories",
      title: text(req.body.overviewTitle) || "Choose what you want to explore."
    };
    state.productCategoryPage.businessPanel = {
      label: text(req.body.businessLabel) || "Business Enquiries",
      title: text(req.body.businessTitle) || "Want product, retail, or distributor details?",
      text: text(req.body.businessText),
      buttonText: text(req.body.businessButtonText) || "Contact Team",
      buttonLink: text(req.body.businessButtonLink) || "/contact"
    };
  });
  await addAudit(req.session.adminUser.email, "product_category_page_update", "productCategoryPage", req);
  res.redirect("/admin/product-category-page");
});

router.post("/product-category-page/slides", requirePermission("categories"), upload.single("backgroundUpload"), multipartCsrfProtection, async function (req, res) {
  const uploadedPath = uploadedPublicPath(req.file);
  await mutate((state) => {
    if (!state.productCategoryPage.suggestionSlides) state.productCategoryPage.suggestionSlides = [];
    const slide = {
      id: id("slide"),
      ...slidePayload(req, { order: state.productCategoryPage.suggestionSlides.length + 1 }, uploadedPath)
    };
    state.productCategoryPage.suggestionSlides.push(slide);
    recordUploadedMedia(state, req, uploadedPath);
  });
  await addAudit(req.session.adminUser.email, "product_slider_slide_create", req.body.title, req);
  res.redirect("/admin/product-category-page");
});

router.post("/product-category-page/slides/:id", requirePermission("categories"), upload.single("backgroundUpload"), multipartCsrfProtection, async function (req, res) {
  const uploadedPath = uploadedPublicPath(req.file);
  await mutate((state) => {
    const slides = state.productCategoryPage.suggestionSlides || [];
    const item = slides.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, slidePayload(req, item, uploadedPath));
    recordUploadedMedia(state, req, uploadedPath);
  });
  await addAudit(req.session.adminUser.email, "product_slider_slide_update", req.params.id, req);
  res.redirect("/admin/product-category-page");
});

router.post("/product-category-page/slides/:id/delete", requirePermission("categories"), async function (req, res) {
  await mutate((state) => {
    state.productCategoryPage.suggestionSlides = (state.productCategoryPage.suggestionSlides || []).filter((entry) => entry.id !== req.params.id);
  });
  await addAudit(req.session.adminUser.email, "product_slider_slide_delete", req.params.id, req);
  res.redirect("/admin/product-category-page");
});

router.get("/layout", requirePermission("content"), async function (_req, res) {
  const state = await readState();
  res.render("admin/layout-manager", {
    title: "Header/Footer Manager | ZUPPIO Admin",
    active: "layout",
    state,
    message: ""
  });
});

router.post("/layout", requirePermission("content"), upload.any(), multipartCsrfProtection, async function (req, res) {
  const logoFile = firstFile(req, "logoUpload");
  const backgroundFile = firstFile(req, "backgroundUpload");
  const logoPath = uploadedPublicPath(logoFile) || imageUrl(req.body.logo);
  const backgroundPath = uploadedPublicPath(backgroundFile) || imageUrl(req.body.backgroundImage);
  await mutate((state) => {
    state.header.logo = logoPath;
    state.footer.brandName = text(req.body.brandName) || state.footer.brandName || state.settings.brandName;
    state.footer.brandText = text(req.body.brandText);
    state.footer.phone = text(req.body.phone);
    state.footer.email = text(req.body.email);
    state.footer.whatsappLink = text(req.body.whatsappLink);
    state.footer.copyrightText = text(req.body.copyrightText);
    state.footer.backgroundImage = backgroundPath;
    recordUploadedMedia(state, req, logoPath, logoFile, "Header logo");
    recordUploadedMedia(state, req, backgroundPath, backgroundFile, "Footer background");

    const navLabels = asArray(req.body.navLabel);
    state.header.navItems = navLabels.map((label, index) => ({
      label: text(label),
      href: text(asArray(req.body.navHref)[index]),
      order: Number(asArray(req.body.navOrder)[index]) || index + 1,
      visible: req.body[`navVisible${index}`] === "on"
    })).filter((item) => item.label || item.href).sort((a, b) => a.order - b.order);

    const exploreLabels = asArray(req.body.exploreLabel);
    state.footer.exploreLinks = exploreLabels.map((label, index) => ({
      label: text(label),
      href: text(asArray(req.body.exploreHref)[index]),
      order: Number(asArray(req.body.exploreOrder)[index]) || index + 1,
      visible: req.body[`exploreVisible${index}`] === "on"
    })).filter((item) => item.label || item.href).sort((a, b) => a.order - b.order);

    const socialLabels = asArray(req.body.socialLabel);
    state.footer.socialLinks = socialLabels.map((label, index) => ({
      label: text(label),
      url: text(asArray(req.body.socialUrl)[index]),
      icon: uploadedPublicPath(firstFile(req, `socialIconUpload${index}`)) || imageUrl(asArray(req.body.socialIcon)[index]),
      visible: req.body[`socialVisible${index}`] === "on"
    })).filter((item) => item.label || item.url || item.icon);
    state.footer.socialLinks.forEach((item, index) => {
      recordUploadedMedia(state, req, item.icon, firstFile(req, `socialIconUpload${index}`), `${item.label || "Social"} icon`);
    });
  });
  await addAudit(req.session.adminUser.email, "layout_update", "header_footer", req);
  const state = await readState();
  res.render("admin/layout-manager", { title: "Header/Footer Manager | ZUPPIO Admin", active: "layout", state, message: "Saved successfully." });
});

router.get("/contact-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Contact Page Manager | ZUPPIO Admin", "contact", "contactPage", "Controls contact hero, company details, social cards, QR cards, and form heading.");
});

router.post("/contact-page", requirePermission("content"), upload.any(), multipartCsrfProtection, saveJsonManager("contactPage", "contact_page_update"));

router.get("/about-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "About Page Manager | ZUPPIO Admin", "about", "aboutPage", "Controls About intro, Who We Are, feature cards, story, mission, vision, and values.");
});

router.post("/about-page", requirePermission("content"), upload.any(), multipartCsrfProtection, saveJsonManager("aboutPage", "about_page_update"));

router.get("/how-to-buy-page", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "How To Buy Manager | ZUPPIO Admin", "how-to-buy", "howToBuy", "Controls finder filters, map details, buying options, tabs, and dealer inquiry content.");
});

router.post("/how-to-buy-page", requirePermission("content"), upload.any(), multipartCsrfProtection, saveJsonManager("howToBuy", "how_to_buy_update"));

router.get("/policies-manager", requirePermission("content"), async function (_req, res) {
  await renderJsonManager(res, "Policies Manager | ZUPPIO Admin", "policies", "policies", "Controls terms cards and policy detail pages.");
});

router.post("/policies-manager", requirePermission("content"), upload.any(), multipartCsrfProtection, saveJsonManager("policies", "policies_update"));

router.get("/blog-page", requirePermission("blog"), async function (_req, res) {
  await renderJsonManager(res, "Blog Page Header | ZUPPIO Admin", "blog-page", "blogPage", "Controls only the blog hero text. The hero artwork stays fixed to the ZUPPIO packet and chips-bowl image used on the website.");
});

router.post("/blog-page", requirePermission("blog"), upload.any(), multipartCsrfProtection, saveJsonManager("blogPage", "blog_page_update"));

router.get("/seo", requirePermission("settings"), async function (_req, res) {
  await renderJsonManager(res, "SEO Manager | ZUPPIO Admin", "seo", "seo", "Controls meta title, description, OG image, canonical URL, and noindex per page.");
});

router.post("/seo", requirePermission("settings"), upload.any(), multipartCsrfProtection, saveJsonManager("seo", "seo_update"));

router.get("/backup", requirePermission("settings"), async function (_req, res) {
  res.render("admin/backup", {
    title: "Backup | ZUPPIO Admin",
    active: "backup",
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
    return res.render("admin/backup", { title: "Backup | ZUPPIO Admin", active: "backup", message: "Invalid JSON backup. Nothing was restored." });
  }
  await mutate((state) => {
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, restored);
  });
  await addAudit(req.session.adminUser.email, "backup_restore", "admin_json", req);
  res.render("admin/backup", { title: "Backup | ZUPPIO Admin", active: "backup", message: "Backup restored successfully." });
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
  const contacts = (state.submissions.contacts || []).map((item) => ["contact", item.name, "", item.email, item.phone || "", "", "", item.subject || "", "", "", item.message, item.status, item.createdAt]);
  const dealers = (state.submissions.dealerInquiries || []).map((item) => [
    "dealer",
    item.name,
    item.businessName || item.shop || "",
    item.email || "",
    item.phone,
    item.city,
    item.state || "",
    item.address || "",
    item.businessType || item.business || "",
    "",
    item.message || "",
    item.status,
    item.createdAt
  ]);
  const wholesale = (state.submissions.wholesaleInquiries || []).map((item) => [
    "wholesale",
    item.name,
    item.businessName || "",
    item.email || "",
    item.phone || "",
    "",
    "",
    "",
    item.productInterest || "",
    item.quantityRequirement || "",
    item.message || "",
    item.status,
    item.createdAt
  ]);
  const rows = [["type", "name", "businessName", "email", "phone", "city", "state", "addressOrSubject", "productOrBusinessType", "quantity", "message", "status", "createdAt"]].concat(contacts, dealers, wholesale);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"zuppio-inquiries.csv\"");
  res.send(rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
});

router.get("/content", requirePermission("content"), async function (_req, res) {
  res.render("admin/manage", { title: "CMS | ZUPPIO Admin", active: "homepage", state: await readState(), kind: "content" });
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

router.post("/products", requirePermission("products"), upload.array("productImages", 12), multipartCsrfProtection, async function (req, res) {
  const productImages = uploadedPublicPaths(req.files);
  await mutate((state) => {
    state.products.unshift({
      id: id("product"),
      name: text(req.body.name),
      slug: text(req.body.slug),
      flavour: text(req.body.flavour),
      price: text(req.body.price),
      packetSize: text(req.body.packetSize),
      weight: text(req.body.weight) || text(req.body.packetSize),
      category: text(req.body.category),
      description: text(req.body.description),
      images: productImages.length ? productImages : csv(req.body.images),
      availability: text(req.body.availability) || "Available",
      offers: text(req.body.offers),
      featured: req.body.featured === "on",
      status: text(req.body.status) || "Active"
    });
    productImages.forEach((publicPath, index) => {
      recordUploadedMedia(state, req, publicPath, req.files[index], `${text(req.body.name) || "Product"} image`);
    });
  });
  await addAudit(req.session.adminUser.email, "product_create", req.body.name, req);
  res.redirect("/admin/products");
});

router.post("/products/:id", requirePermission("products"), upload.array("productImages", 12), multipartCsrfProtection, async function (req, res) {
  const productImages = uploadedPublicPaths(req.files);
  await mutate((state) => {
    const item = state.products.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, {
      name: text(req.body.name),
      slug: text(req.body.slug),
      flavour: text(req.body.flavour),
      price: text(req.body.price),
      packetSize: text(req.body.packetSize),
      weight: text(req.body.weight) || text(req.body.packetSize),
      category: text(req.body.category),
      description: text(req.body.description),
      images: productImages.length ? productImages : csv(req.body.images),
      availability: text(req.body.availability),
      offers: text(req.body.offers),
      featured: req.body.featured === "on",
      status: text(req.body.status)
    });
    productImages.forEach((publicPath, index) => {
      recordUploadedMedia(state, req, publicPath, req.files[index], `${text(req.body.name) || "Product"} image`);
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
  res.render("admin/manage", { title: "Categories | ZUPPIO Admin", active: "product-categories", state: await readState(), kind: "categories" });
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

router.post("/media", requirePermission("media"), upload.single("media"), multipartCsrfProtection, async function (req, res) {
  if (!req.file) return res.redirect("/admin/media");
  const publicPath = uploadedPublicPath(req.file);
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
  res.render("admin/manage", { title: "Swiper Images | ZUPPIO Admin", active: "media", state: await readState(), kind: "swiper" });
});

router.post("/swiper/:id", requirePermission("swiper"), upload.any(), multipartCsrfProtection, async function (req, res) {
  const desktopImage = uploadedPublicPath(firstFile(req, "desktopUpload")) || imageUrl(req.body.desktopImage);
  const tabletImage = uploadedPublicPath(firstFile(req, "tabletUpload")) || imageUrl(req.body.tabletImage);
  const mobileImage = uploadedPublicPath(firstFile(req, "mobileUpload")) || imageUrl(req.body.mobileImage);
  await mutate((state) => {
    const item = state.swiperSlides.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { title: text(req.body.title), desktopImage, tabletImage, mobileImage, alt: text(req.body.alt), status: text(req.body.status) || "Active" });
    recordUploadedMedia(state, req, desktopImage, firstFile(req, "desktopUpload"), `${text(req.body.title) || "Swiper"} desktop image`);
    recordUploadedMedia(state, req, tabletImage, firstFile(req, "tabletUpload"), `${text(req.body.title) || "Swiper"} tablet image`);
    recordUploadedMedia(state, req, mobileImage, firstFile(req, "mobileUpload"), `${text(req.body.title) || "Swiper"} mobile image`);
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
  res.render("admin/manage", { title: "Inquiries / Submissions | ZUPPIO Admin", active: "messages", state: await readState(), kind: "messages" });
});

router.post("/messages/:type/:id", requirePermission("messages"), async function (req, res) {
  const action = text(req.body.action || "status").toLowerCase();
  const allowedStatuses = ["New", "Read", "Replied"];
  const actionStatus = { read: "Read", replied: "Replied" }[action];
  const requestedStatus = actionStatus || text(req.body.status);
  const changed = await mutate((state) => {
    const lists = {
      feedback: state.feedback,
      inquiry: state.inquiries,
      contact: state.submissions.contacts && state.submissions.contacts.length ? state.submissions.contacts : state.inquiries,
      dealer: state.submissions.dealerInquiries || [],
      wholesale: state.submissions.wholesaleInquiries || [],
      newsletter: state.submissions.newsletter && state.submissions.newsletter.length ? state.submissions.newsletter : state.subscribers
    };
    const list = lists[req.params.type] || state.inquiries;
    const item = list.find((entry) => entry.id === req.params.id);
    if (!item) return false;

    if (action === "delete") {
      if (req.params.type === "contact") {
        state.submissions.contacts = state.submissions.contacts.filter((entry) => entry.id !== req.params.id);
        state.inquiries = state.inquiries.filter((entry) => entry.id !== req.params.id);
      } else if (req.params.type === "dealer") {
        state.submissions.dealerInquiries = state.submissions.dealerInquiries.filter((entry) => entry.id !== req.params.id);
      } else if (req.params.type === "wholesale") {
        state.submissions.wholesaleInquiries = state.submissions.wholesaleInquiries.filter((entry) => entry.id !== req.params.id);
      } else {
        const index = list.findIndex((entry) => entry.id === req.params.id);
        if (index >= 0) list.splice(index, 1);
      }
    } else {
      const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : "New";
      item.status = status;
      item.updatedAt = now();
      if (req.params.type === "contact") {
        [state.inquiries, state.submissions.contacts].forEach((contactList) => {
          const matching = contactList.find((entry) => entry.id === req.params.id);
          if (matching) Object.assign(matching, { status, updatedAt: item.updatedAt });
        });
      }
    }

    state.analytics.contactSubmissions = state.submissions.contacts.length;
    state.analytics.dealerInquiries = state.submissions.dealerInquiries.length;
    state.analytics.wholesaleInquiries = state.submissions.wholesaleInquiries.length;
    return true;
  });
  if (changed) {
    await addAudit(req.session.adminUser.email, action === "delete" ? `${req.params.type}_inquiry_delete` : `${req.params.type}_inquiry_${(requestedStatus || "new").toLowerCase()}`, req.params.id, req);
  }
  res.redirect(req.body.redirect || "/admin/messages");
});

router.get("/newsletter", requirePermission("messages"), async function (_req, res) {
  res.render("admin/manage", { title: "Newsletter Subscribers | ZUPPIO Admin", active: "newsletter", state: await readState(), kind: "newsletter" });
});

router.get("/analytics", requirePermission("analytics"), async function (_req, res) {
  res.render("admin/manage", { title: "Analytics | ZUPPIO Admin", active: "analytics", state: await readState(), kind: "analytics" });
});

router.get("/blog", requirePermission("blog"), async function (_req, res) {
  res.render("admin/manage", { title: "Blogs | ZUPPIO Admin", active: "blogs", state: await readState(), kind: "blog" });
});

router.post("/blog", requirePermission("blog"), upload.single("blogImage"), multipartCsrfProtection, async function (req, res) {
  const blogImage = uploadedPublicPath(req.file) || imageUrl(req.body.image);
  await mutate((state) => {
    state.blogPosts.unshift({ id: id("blog"), title: text(req.body.title), slug: text(req.body.slug), description: text(req.body.description), content: text(req.body.content), category: text(req.body.category), tags: csv(req.body.tags), image: blogImage, status: text(req.body.status) || "Draft", seoTitle: text(req.body.seoTitle), seoDescription: text(req.body.seoDescription) });
    recordUploadedMedia(state, req, blogImage, req.file, `${text(req.body.title) || "Blog"} image`);
  });
  await addAudit(req.session.adminUser.email, "blog_create", req.body.title, req);
  res.redirect("/admin/blog");
});

router.post("/blog/:id", requirePermission("blog"), upload.single("blogImage"), multipartCsrfProtection, async function (req, res) {
  const blogImage = uploadedPublicPath(req.file) || imageUrl(req.body.image);
  await mutate((state) => {
    const item = state.blogPosts.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, { title: text(req.body.title), slug: text(req.body.slug), description: text(req.body.description), content: text(req.body.content), category: text(req.body.category), tags: csv(req.body.tags), image: blogImage, status: text(req.body.status), seoTitle: text(req.body.seoTitle), seoDescription: text(req.body.seoDescription) });
    recordUploadedMedia(state, req, blogImage, req.file, `${text(req.body.title) || "Blog"} image`);
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
    state.faqs.push({
      id: id("faq"),
      question: text(req.body.question),
      answer: text(req.body.answer),
      pageLocation: text(req.body.pageLocation) || "Homepage",
      status: text(req.body.status) || "Published",
      order: Number(req.body.order) || state.faqs.length + 1
    });
    state.faqs.sort((a, b) => a.order - b.order);
  });
  await addAudit(req.session.adminUser.email, "faq_create", req.body.question, req);
  res.redirect("/admin/faqs");
});

router.post("/faqs/:id", requirePermission("faqs"), async function (req, res) {
  await mutate((state) => {
    const item = state.faqs.find((entry) => entry.id === req.params.id);
    if (item) Object.assign(item, {
      question: text(req.body.question),
      answer: text(req.body.answer),
      pageLocation: text(req.body.pageLocation) || item.pageLocation || "Homepage",
      status: text(req.body.status) || item.status || "Published",
      order: Number(req.body.order) || item.order
    });
    state.faqs.sort((a, b) => a.order - b.order);
  });
  await addAudit(req.session.adminUser.email, "faq_update", req.params.id, req);
  res.redirect("/admin/faqs");
});

router.post("/faqs/:id/delete", requirePermission("faqs"), async function (req, res) {
  await mutate((state) => {
    state.faqs = state.faqs.filter((entry) => entry.id !== req.params.id);
  });
  await addAudit(req.session.adminUser.email, "faq_delete", req.params.id, req);
  res.redirect("/admin/faqs");
});

router.get("/settings", requirePermission("settings"), async function (_req, res) {
  res.render("admin/manage", {
    title: "Settings | ZUPPIO Admin",
    active: "settings",
    state: await readState(),
    kind: "settings",
    envStatus: {
      googleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      smtp: Boolean(process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS),
      mongodb: Boolean(process.env.MONGODB_URI)
    }
  });
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
  res.render("admin/manage", { title: "Audit Logs | ZUPPIO Admin", active: "analytics", state: await readState(), kind: "audit" });
});

router.get("/api/analytics", requirePermission("analytics"), async function (_req, res) {
  const state = await readState();
  res.json({
    analytics: state.analytics,
    totals: {
      inquiries: state.submissions.contacts.length + state.submissions.dealerInquiries.length + state.submissions.wholesaleInquiries.length,
      contacts: state.submissions.contacts.length,
      dealerInquiries: state.submissions.dealerInquiries.length,
      wholesaleInquiries: state.submissions.wholesaleInquiries.length,
      feedback: state.feedback.length,
      subscribers: state.subscribers.length,
      products: state.products.length
    }
  });
});

module.exports = router;
