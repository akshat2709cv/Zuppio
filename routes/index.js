const express = require("express");
const router = express.Router();
const { sendInquiryNotification, sendSnackDropConfirmation } = require("../services/emailService");
const { addAudit, id, mutate, now, readState } = require("../services/adminStore");
const { flavors, pages, productCategories, findProductCategory, normalizeProductCategories } = require("../services/siteData");

const policies = [
  {
    slug: "acceptance",
    view: "policies/acceptance",
    title: "Accuracy & Acceptance of Terms",
    preview: `By using the ZUPPIO website, you agree to these terms and all related policies.`,
    detail:
      `Welcome to the official website of Zuppio Snacks Private Limited operating under the brand name Zuppio.

By accessing, browsing, or using this website, you agree to follow and be bound by these Terms & Conditions, Privacy Policy, Disclaimer, and all applicable laws and regulations. If you do not agree with any part of these terms, you should not use this website.

We make reasonable efforts to keep the information on this website accurate, updated, and complete. However, product details, packaging, flavours, prices, availability, offers, images, and other information may change from time to time without prior notice.

Zuppio Snacks Private Limited reserves the right to update, modify, suspend, or remove any content from this website at any time. Continued use of the website after changes means you accept the updated terms.`,
    highlights: [
      "Website use means acceptance of all policies",
      "Do not use the website if you disagree",
      "Product and website information may change",
      "Content may be updated or removed without notice",
      "Continued use means acceptance of updated terms"
    ]
  },
  {
    slug: "privacy",
    view: "policies/privacy",
    title: "Privacy & Policies",
    preview: `Learn how Zuppio collects, uses, protects, and lawfully shares information submitted through the website.`,
    detail:
      `At Zuppio Snacks Private Limited, we respect your privacy and are committed to protecting the personal information shared by users, customers, distributors, retailers, vendors, and visitors through our website.

We may collect basic information such as your name, mobile number, email address, city, business details, enquiry details, feedback, and other information voluntarily submitted through forms, calls, emails, WhatsApp, or website interactions.

This information may be used for:

Customer support and enquiry response
Distributor, retailer, or business communication
Product feedback and service improvement
Marketing communication, only where legally permitted
Order, supply, or business-related coordination
Website performance and user experience improvement

We do not sell your personal information to third parties. We may share information only with trusted service providers, business partners, legal authorities, or internal teams when required for lawful business purposes.

Users may contact us to request correction, update, or deletion of their personal information, subject to applicable law and business/legal record requirements. The DPDP framework emphasizes lawful purpose, consent, transparency, data minimization, and user rights such as correction and erasure.

Contact for privacy-related queries:
Email: zuppiosnacks.pvt.ltd@gmail.com
Address: A433, Sudamapuri, Vijay Nagar, Ghaziabad, Uttar Pradesh - 201001`,
    highlights: [
      "Voluntarily submitted personal data may be collected",
      "Information supports enquiries, business communication, and improvement",
      "Personal data is not sold",
      "Sharing is limited to lawful business or legal needs",
      "Users may request correction, updates, or deletion"
    ]
  },
  {
    slug: "disclaimer",
    view: "policies/disclaimer",
    title: "Disclaimer & Limitations / Use of Site",
    preview: `Website content is provided for general information, and users must use the platform lawfully and responsibly.`,
    detail:
      `The content available on this website is provided for general information, brand awareness, product information, business enquiries, and customer communication purposes only.

While we try to provide accurate and updated information, Zuppio Snacks Private Limited does not guarantee that the website will always be error-free, uninterrupted, fully updated, or free from technical issues.

Product images shown on the website are for representation purposes only. Actual product packaging, colour, weight, appearance, design, or availability may vary due to printing, manufacturing, supply chain, or design updates.

Users agree not to misuse this website in any way, including but not limited to:

Copying website content without permission
Uploading harmful code, spam, or malware
Misrepresenting identity or business details
Using the website for illegal or fraudulent purposes
Damaging, disabling, or interfering with website operations
Using brand assets, images, or product information without written approval

Zuppio Snacks Private Limited shall not be liable for any direct, indirect, incidental, consequential, or business loss arising from the use or inability to use this website, reliance on website content, technical errors, third-party links, or changes in product information.`,
    highlights: [
      "Content is for general information only",
      "Accuracy and uninterrupted access are not guaranteed",
      "Product images and details may vary",
      "Illegal, harmful, or unauthorized use is prohibited",
      "Company liability is limited for website-related losses"
    ]
  },
  {
    slug: "Trademarks",
    view: "policies/Trademarks",
    title: "Trademarks",
    preview: `All trademarks, logos, and brand elements displayed on this website are the property of Zuppio Snacks Private Limited.`,
    detail:
      `The name Zuppio, brand logo, product names, flavour names, packaging designs, taglines, graphics, icons, labels, slogans, and other brand elements displayed on this website are the property of Zuppio Snacks Private Limited, unless otherwise stated.

No visitor, retailer, distributor, agency, vendor, or third party is allowed to use, reproduce, copy, modify, publish, distribute, advertise, or commercially exploit any Zuppio trademark, brand name, design, or logo without prior written permission from the company.

Any unauthorized use of our brand identity may lead to legal action under applicable trademark and intellectual property laws.`,
    highlights: [
      "Zuppio brand elements belong to the company",
      "Reproduction or commercial use requires written permission",
      "Restrictions apply to visitors and business partners",
      "Unauthorized brand use is prohibited",
      "Trademark misuse may result in legal action"
    ]
  },
  {
    slug: "copyright",
    view: "policies/copyright",
    title: "Copyrights",
    preview: `Zuppio website content is protected and may only be used for permitted personal or informational purposes.`,
    detail:
      `All content on this website, including text, images, product photos, packaging designs, graphics, videos, illustrations, layouts, website design, written content, marketing material, and downloadable content, is owned by or licensed to Zuppio Snacks Private Limited, unless mentioned otherwise.

Users may view website content for personal or informational purposes only. No content may be copied, reproduced, republished, uploaded, posted, transmitted, edited, sold, or used for commercial purposes without written consent from Zuppio Snacks Private Limited.

If any third-party content, image, or reference is used on the website, it remains the property of its respective owner.`,
    highlights: [
      "Website content is owned by or licensed to Zuppio",
      "Viewing is limited to personal or informational purposes",
      "Copying or republication requires written consent",
      "Commercial use requires written consent",
      "Third-party content remains with its owner"
    ]
  },
  {
    slug: "jurisdictions",
    view: "policies/jurisdictions",
    title: "Jurisdiction",
    preview: `Website-related legal matters are governed by Indian law and the competent courts in Ghaziabad.`,
    detail:
      `These Terms & Conditions, Privacy Policy, Disclaimer, and other website-related matters shall be governed by the laws of India.

Any dispute, claim, or legal matter arising out of the use of this website, brand communication, product information, or related business interaction shall be subject to the jurisdiction of the competent courts located in Ghaziabad, Uttar Pradesh, India, unless otherwise required by applicable law.

Zuppio Snacks Private Limited reserves the right to take appropriate legal action in case of misuse of website content, brand assets, trademarks, copyrighted material, misleading representation, fraud, or violation of these terms.`,
    highlights: [
      "Governed by Indian laws",
      "Ghaziabad courts have jurisdiction",
      "Applies to website, brand, product, and business interactions",
      "Legal action may be taken for content or intellectual-property misuse",
      "Fraud, misleading representation, and violations may be pursued"
    ]
  }
];

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_TIMEOUT_MS = 12000;
const DELAYED_EMAIL_MESSAGE = "Submitted successfully. Email confirmation may be delayed.";

const successMessages = {
  newsletter: "Thank you! Confirmation sent successfully.",
  contact: "Message sent successfully.",
  dealer: "Dealer inquiry submitted successfully.",
  wholesale: "Wholesale inquiry submitted successfully."
};

const supplementalBlogPosts = [
  {
    id: "blog_display_flavor_lineup",
    title: "ZUPPIO Flavor Lineup for Every Snack Mood",
    slug: "zuppio-flavor-lineup-for-every-snack-mood",
    description: "Explore the crunchy flavor mix that makes ZUPPIO packs perfect for home, travel, shops, and party tables.",
    category: "Product Stories",
    tags: ["flavors", "chips", "lineup"],
    image: "/images/banner.jpeg",
    status: "Published",
    content: [
      "A strong snack shelf needs choice. ZUPPIO keeps its flavor lineup focused on familiar Indian cravings, bright packaging, and an easy pick-up feel for customers.",
      "The goal is simple: every pack should look clear on the shelf and taste dependable when opened. That balance helps retailers sell confidently and helps families choose quickly.",
      "As the brand grows, new flavors can be added around the same idea of bold taste, clean presentation, and consistent crunch."
    ],
    seoDescription: "Explore ZUPPIO flavor lineup ideas for Indian snack moods."
  },
  {
    id: "blog_display_retail_shelf",
    title: "How Retailers Can Display ZUPPIO Snacks",
    slug: "how-retailers-can-display-zuppio-snacks",
    description: "Simple display ideas for shops that want ZUPPIO packs to look sharp, visible, and easy to buy.",
    category: "Business & Partners",
    tags: ["retail", "display", "dealer"],
    image: "/images/zuppio-footer-product-showcase.png",
    status: "Published",
    content: [
      "Good snack display is about visibility. Keep packs upright, group flavors together, and place fast-moving chips near the counter or high-traffic shelves.",
      "Bright ZUPPIO packs are built to catch attention, so a clean row with clear pricing can make the product feel more trustworthy and easier to choose.",
      "Retailers can also pair chips with beverages or quick party items to create a natural snack basket for customers."
    ],
    seoDescription: "Retail display ideas for ZUPPIO snacks and dealers."
  },
  {
    id: "blog_display_tea_time",
    title: "Tea-Time Snack Ideas With ZUPPIO Chips",
    slug: "tea-time-snack-ideas-with-zuppio-chips",
    description: "Easy pairings for evening tea, office breaks, and relaxed family snack moments.",
    category: "Recipes",
    tags: ["tea time", "recipes", "chips"],
    image: "/images/yellow.png",
    status: "Published",
    content: [
      "Tea-time snacks should be quick, crisp, and easy to share. Serve ZUPPIO chips with chutney dips, masala peanuts, chopped salad, or a light sandwich plate.",
      "For a fast chaat-style bowl, add chips just before serving with onion, tomato, coriander, lemon, and a pinch of chaat masala.",
      "The best part is speed. You can create a full snack plate in minutes while keeping the crunch fresh."
    ],
    seoDescription: "Tea-time snack ideas using ZUPPIO chips."
  },
  {
    id: "blog_display_fmcg_growth",
    title: "Building a Modern Indian FMCG Snack Brand",
    slug: "building-a-modern-indian-fmcg-snack-brand",
    description: "Why packaging, quality, distribution, and repeat taste matter for ZUPPIO's long-term growth.",
    category: "Quality & Process",
    tags: ["fmcg", "quality", "brand"],
    image: "/images/home-hero-zuppio.jpeg",
    status: "Published",
    content: [
      "A modern FMCG snack brand has to win in many places at once: taste, pack appeal, retailer confidence, supply consistency, and customer memory.",
      "ZUPPIO's direction is built around clean product communication and snack formats people already understand. That makes growth practical without losing personality.",
      "With steady quality and a clear shelf presence, the brand can expand into new categories while keeping the same promise of enjoyable snacking."
    ],
    seoDescription: "How ZUPPIO is building a modern Indian FMCG snack brand."
  }
];

function displayBlogPosts(adminState) {
  const publishedPosts = (adminState.blogPosts || []).filter((post) => post.status === "Published");
  const existingSlugs = new Set(publishedPosts.map((post) => post.slug));
  const extras = supplementalBlogPosts.filter((post) => !existingSlugs.has(post.slug));
  return [...publishedPosts, ...extras];
}

function cleanText(value, limit = 500) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function cleanMessage(value, limit = 3000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit);
}

function cleanEmail(value) {
  return cleanText(value, 160).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return String(value || "").replace(/\D/g, "").length >= 7;
}

function wantsJson(req) {
  return req.accepts(["json", "html"]) === "json";
}

function formResponse(req, res, status, payload, redirectPath) {
  if (wantsJson(req)) return res.status(status).json(payload);
  if (status >= 400) return res.status(status).send(payload.message);
  return res.redirect(redirectPath);
}

function responsePayload(success, message, extra = {}) {
  return {
    success,
    ok: success,
    message,
    ...extra
  };
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${label} timed out.`);
      error.code = "EMAIL_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function isRecentDuplicate(items, matches) {
  const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
  return items.find((item) => {
    const createdAt = Date.parse(item.createdAt || "");
    return Number.isFinite(createdAt) && createdAt >= cutoff && matches(item);
  });
}

async function notifyInquiry(type, inquiry) {
  try {
    await withTimeout(sendInquiryNotification(type, inquiry), EMAIL_TIMEOUT_MS, `${type} inquiry email`);
    return true;
  } catch (error) {
    console.error(`${type} inquiry email failed:`, error.message);
    return false;
  }
}

async function notifySnackDrop(email) {
  try {
    await withTimeout(sendSnackDropConfirmation(email), EMAIL_TIMEOUT_MS, "Snack drop confirmation email");
    return true;
  } catch (error) {
    console.error("Snack drop email failed:", error.message);
    return false;
  }
}

async function renderPage(req, res, view, title, activePage, extra = {}) {
  const adminState = await readState();
  const seoKey = extra.seoKey || "home";
  const seo = adminState.seo && adminState.seo[seoKey] ? adminState.seo[seoKey] : {};
  const managedProductCategories = normalizeProductCategories(adminState.productCategories || productCategories);
  const headerPages = (adminState.header.navItems || pages)
    .filter((item) => item.visible !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  res.render(view, {
    title: seo.title || title,
    metaDescription: seo.description || "ZUPPIO is a premium modern snack brand with bold chips flavors and fresh snack drops.",
    ogImage: seo.ogImage || "",
    canonicalUrl: seo.canonicalUrl || "",
    noindex: Boolean(seo.noindex),
    activePage,
    pages: headerPages,
    siteHeader: adminState.header,
    siteFooter: adminState.footer,
    flavors,
    productCategories: managedProductCategories,
    productCategoryPage: adminState.productCategoryPage,
    homepage: adminState.homepage,
    blogPageContent: adminState.blogPage,
    contactPage: adminState.contactPage,
    aboutPage: adminState.aboutPage,
    howToBuy: adminState.howToBuy || adminState.howToBuyPage,
    howToBuyPage: adminState.howToBuyPage,
    responsiveSwiperSlides: adminState.swiperSlides.filter((slide) => slide.status === "Active"),
    managedBlogPosts: displayBlogPosts(adminState),
    siteFaqs: adminState.faqs || [],
    siteSettings: adminState.settings,
    policies: adminState.policies.items || policies,
    policiesConfig: adminState.policies,
    ...extra
  });
}

router.get("/", async function (req, res) {
  await renderPage(req, res, "index", "ZUPPIO | Crunch Karo, Smile Karo.", "Home", { seoKey: "home" });
});

router.get("/product-categories", async function (req, res) {
  await renderPage(req, res, "flavors", "Product Categories | ZUPPIO", "Product Categories", { seoKey: "productCategories" });
});

router.get("/product-categories/:slug", async function (req, res, next) {
  const adminState = await readState();
  const managedProductCategories = normalizeProductCategories(adminState.productCategories || productCategories);
  const category = findProductCategory(managedProductCategories, req.params.slug);

  if (!category) return next();

  await renderPage(req, res, "product-category", `${category.title} | Product Categories | ZUPPIO`, "Product Categories", {
    seoKey: "productCategories",
    category,
    productCategories: managedProductCategories,
    metaDescription: category.description || category.summary || `Explore ${category.title} products from ZUPPIO.`
  });
});

router.get("/flavors", function (_req, res) {
  res.redirect(301, "/product-categories");
});

router.get("/how-to-buy", async function (req, res) {
  await renderPage(req, res, "how-to-buy", "Where To Buy ZUPPIO | ZUPPIO", "How To Buy", {
    seoKey: "howToBuy",
    isStoreLocatorPage: true,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
  });
});

router.get("/where-to-buy", function (_req, res) {
  res.redirect(301, "/how-to-buy");
});

router.get("/blogs", async function (req, res) {
  const requestedPage = Number.parseInt(req.query.page, 10);
  await renderPage(req, res, "blogs", "Blogs | ZUPPIO", "Blogs", {
    seoKey: "blogs",
    currentBlogPage: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageHero: { breadcrumbTitle: "Blogs", commandTitle: "BLOG COMMAND CENTER", pageTitle: "BLOGS" }
  });
});

router.get("/blogs/:slug", async function (req, res, next) {
  const adminState = await readState();
  const blog = displayBlogPosts(adminState).find((post) => post.slug === req.params.slug && post.status === "Published");

  if (!blog) return next();

  await renderPage(req, res, "blog-detail", `${blog.title} | ZUPPIO Blog`, "Blogs", {
    seoKey: "blogDetail",
    blog,
    metaDescription: blog.seoDescription || blog.description || "Read ZUPPIO snack stories, food ideas, recipes, and brand updates."
  });
});

router.get("/about", async function (req, res) {
  await renderPage(req, res, "about", "About | ZUPPIO", "About", {
    seoKey: "about"
  });
});

router.get("/contact", async function (req, res) {
  await renderPage(req, res, "contact", "Contact | ZUPPIO", "Contact", {
    seoKey: "contact"
  });
});

router.get("/terms", async function (req, res) {
  await renderPage(req, res, "terms", "Terms | ZUPPIO", "Terms", {
    seoKey: "terms"
  });
});

router.get("/privacy-policy", function (_req, res) {
  res.redirect(301, "/terms/privacy");
});

router.get("/faq", async function (req, res) {
  await renderPage(req, res, "faq", "FAQ | ZUPPIO", "FAQ", {
    seoKey: "faq",
    pageHero: {
      breadcrumbTitle: "FAQ",
      commandTitle: "HELP CENTER",
      pageTitle: "FAQ"
    }
  });
});

router.post("/snack-drop-alerts", async function (req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const wantsJson = req.accepts(["json", "html"]) === "json";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const payload = responsePayload(false, "Please enter a valid email address.");
    return wantsJson ? res.status(400).json(payload) : res.status(400).send(payload.message);
  }

  await mutate((state) => {
    if (!state.subscribers.some((subscriber) => subscriber.email === email)) {
      const subscriber = { id: id("subscriber"), email, status: "Active", createdAt: now() };
      state.subscribers.unshift(subscriber);
      state.submissions.newsletter.unshift(subscriber);
    }
    state.analytics.newsletterSubscribers = state.subscribers.length;
  });
  await addAudit(email, "subscriber_create", "snack-drop", req);

  const notificationSent = await notifySnackDrop(email);
  const payload = responsePayload(true, notificationSent ? successMessages.newsletter : DELAYED_EMAIL_MESSAGE, {
    notificationSent,
    emailDelayed: !notificationSent
  });
  return wantsJson ? res.json(payload) : res.redirect("/?snackDrop=sent");
});

router.post("/contact", async function (req, res) {
  const inquiry = {
    id: id("contact"),
    type: "contact",
    source: "Contact Form",
    name: cleanText(req.body.name, 120),
    email: cleanEmail(req.body.email),
    phone: cleanText(req.body.phone, 60),
    subject: cleanText(req.body.subject, 180),
    message: cleanMessage(req.body.message),
    ip: cleanText(req.ip, 80),
    status: "New",
    createdAt: now(),
    updatedAt: now()
  };

  if (!inquiry.name || !validEmail(inquiry.email) || !inquiry.message || (inquiry.phone && !validPhone(inquiry.phone))) {
    return formResponse(req, res, 400, responsePayload(false, "Please enter a valid name, email, optional phone number, and message."), "/contact");
  }

  const saved = await mutate((state) => {
    const duplicate = isRecentDuplicate(state.submissions.contacts, (item) =>
      item.email === inquiry.email && item.message === inquiry.message
    );
    if (duplicate) return { inquiry: duplicate, duplicate: true };
    state.inquiries.unshift(inquiry);
    state.submissions.contacts.unshift(inquiry);
    state.analytics.contactSubmissions = state.submissions.contacts.length;
    return { inquiry, duplicate: false };
  });

  if (saved.duplicate) {
    return formResponse(req, res, 200, responsePayload(true, successMessages.contact, { duplicate: true }), "/contact?message=received");
  }

  await addAudit(inquiry.email, "contact_submission_create", inquiry.id, req);
  const notificationSent = await notifyInquiry("contact", inquiry);
  return formResponse(req, res, 200, responsePayload(true, notificationSent ? successMessages.contact : DELAYED_EMAIL_MESSAGE, {
    notificationSent,
    emailDelayed: !notificationSent
  }), "/contact?message=sent");
});

router.post("/dealer-inquiries", async function (req, res) {
  const inquiry = {
    id: id("dealer"),
    type: "dealer",
    source: "Where To Buy Dealer Inquiry",
    name: cleanText(req.body.name || req.body.fullName, 120),
    businessName: cleanText(req.body.businessName || req.body.shop, 160),
    email: cleanEmail(req.body.email),
    phone: cleanText(req.body.phone, 60),
    city: cleanText(req.body.city, 120),
    state: cleanText(req.body.state, 120),
    address: cleanText(req.body.address, 300),
    businessType: cleanText(req.body.businessType || req.body.business, 160),
    message: cleanMessage(req.body.message),
    ip: cleanText(req.ip, 80),
    status: "New",
    createdAt: now(),
    updatedAt: now()
  };

  if (!inquiry.name || !inquiry.businessName || !validEmail(inquiry.email) || !validPhone(inquiry.phone) || !inquiry.city || !inquiry.state || !inquiry.message) {
    return formResponse(req, res, 400, responsePayload(false, "Please enter name, business name, valid email, phone, city, state, and message."), "/how-to-buy#dealer-inquiry");
  }

  const saved = await mutate((state) => {
    const duplicate = isRecentDuplicate(state.submissions.dealerInquiries, (item) =>
      item.email === inquiry.email && item.phone === inquiry.phone && item.message === inquiry.message
    );
    if (duplicate) return { inquiry: duplicate, duplicate: true };
    state.submissions.dealerInquiries.unshift(inquiry);
    state.analytics.dealerInquiries = state.submissions.dealerInquiries.length;
    return { inquiry, duplicate: false };
  });

  if (saved.duplicate) {
    return formResponse(req, res, 200, responsePayload(true, successMessages.dealer, { duplicate: true }), "/how-to-buy?dealer=received#dealer-inquiry");
  }

  await addAudit(inquiry.email, "dealer_inquiry_create", inquiry.id, req);
  const notificationSent = await notifyInquiry("dealer", inquiry);
  return formResponse(req, res, 200, responsePayload(true, notificationSent ? successMessages.dealer : DELAYED_EMAIL_MESSAGE, {
    notificationSent,
    emailDelayed: !notificationSent
  }), "/how-to-buy?dealer=sent#dealer-inquiry");
});

router.post("/wholesale-inquiries", async function (req, res) {
  const inquiry = {
    id: id("wholesale"),
    type: "wholesale",
    source: "Where To Buy Wholesale Inquiry",
    name: cleanText(req.body.name, 120),
    businessName: cleanText(req.body.businessName, 160),
    email: cleanEmail(req.body.email),
    phone: cleanText(req.body.phone, 60),
    productInterest: cleanText(req.body.productInterest, 240),
    quantityRequirement: cleanText(req.body.quantityRequirement || req.body.quantity, 160),
    message: cleanMessage(req.body.message),
    ip: cleanText(req.ip, 80),
    status: "New",
    createdAt: now(),
    updatedAt: now()
  };

  if (!inquiry.name || !validEmail(inquiry.email) || !validPhone(inquiry.phone) || !inquiry.productInterest || !inquiry.quantityRequirement || !inquiry.message) {
    return formResponse(req, res, 400, responsePayload(false, "Please enter name, valid email, phone, product interest, quantity requirement, and message."), "/how-to-buy#wholesale-inquiry");
  }

  const saved = await mutate((state) => {
    const duplicate = isRecentDuplicate(state.submissions.wholesaleInquiries, (item) =>
      item.email === inquiry.email &&
      item.productInterest === inquiry.productInterest &&
      item.quantityRequirement === inquiry.quantityRequirement
    );
    if (duplicate) return { inquiry: duplicate, duplicate: true };
    state.submissions.wholesaleInquiries.unshift(inquiry);
    state.analytics.wholesaleInquiries = state.submissions.wholesaleInquiries.length;
    return { inquiry, duplicate: false };
  });

  if (saved.duplicate) {
    return formResponse(req, res, 200, responsePayload(true, successMessages.wholesale, { duplicate: true }), "/how-to-buy?wholesale=received#wholesale-inquiry");
  }

  await addAudit(inquiry.email, "wholesale_inquiry_create", inquiry.id, req);
  const notificationSent = await notifyInquiry("wholesale", inquiry);
  return formResponse(req, res, 200, responsePayload(true, notificationSent ? successMessages.wholesale : DELAYED_EMAIL_MESSAGE, {
    notificationSent,
    emailDelayed: !notificationSent
  }), "/how-to-buy?wholesale=sent#wholesale-inquiry");
});

router.get("/terms/:slug", async function (req, res, next) {
  const state = await readState();
  const policy = (state.policies.items || policies).find((item) => item.slug === req.params.slug);
  if (!policy) return next();
  await renderPage(req, res, "partials/policy-detail", `${policy.title} | ZUPPIO Terms`, "Terms", {
    seoKey: "terms",
    policy
  });
});

module.exports = router;
