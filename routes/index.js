const express = require("express");
const router = express.Router();
const { sendSnackDropConfirmation } = require("../services/emailService");
const { addAudit, id, mutate, now, readState } = require("../services/adminStore");
const { flavors, pages, productCategories } = require("../services/siteData");

const policies = [
  {
    slug: "acceptance",
    view: "policies/acceptance",
    title: "Accuracy & Acceptance of Terms",
    preview: `By using ZUPPIO, you agree to our digital snack universe rules.`,
    
    detail:
      `Welcome to the official website of Zuppio Snacks Private Limited operating under the brand name Zuppio.

By accessing, browsing, or using this website, you agree to follow and be bound by these Terms & Conditions, Privacy Policy, Disclaimer, and all applicable laws and regulations. If you do not agree with any part of these terms, you should not use this website.

We make reasonable efforts to keep the information on this website accurate, updated, and complete. However, product details, packaging, flavours, prices, availability, offers, images, and other information may change from time to time without prior notice.

Zuppio Snacks Private Limited reserves the right to update, modify, suspend, or remove any content from this website at any time. Continued use of the website after changes means you accept the updated terms.`,
    highlights: [
      "Website use means acceptance of terms",
      "Information may change anytime",
      "Product details may vary",
      "Content may be updated without notice",
      "Continued use means agreement"
    ]
  },
  {
    slug: "privacy",
    view: "policies/privacy",
    title: "Privacy & Policies",
    preview: `Your privacy is important to us. By using this website.`,
    
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
Email: aloosnackacustomerfeedback@gmail.com
Address: viyaj nagar - ghaziabad - 201001`,
    highlights: [
      "Basic user data may be collected",
      "Information used for support & communication",
      "Personal data is not sold",
      "Data shared only for legal/business purposes",
      "Users may request data correction or deletion"
    ]
  },
  {
    slug: "disclaimer",
    view: "policies/disclaimer",
    title: "Disclaimer & Limitations or Uses of Site",
    preview: `All content is provided as available without guarantees & Use the platform responsibly and respectfully.`,
    
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
      "Website may contain errors or interruptions",
      "Product images are for representation only",
      "Website misuse is prohibited",
      "Company is not liable for losses"
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
      "Zuppio brand assets are protected",
      "Unauthorized use is prohibited",
      "Written permission is required",
      "Logos and packaging belong to company",
      "Trademark misuse may lead to legal action"
    ]
  },
  
  {
    slug: "copyright",
    view: "policies/copyright",
    title: "Copyright",
    preview: `Original content belongs to the ZUPPIO brand & identity is officially protected.`,
    badge: "07",
    detail:
      `All content on this website, including text, images, product photos, packaging designs, graphics, videos, illustrations, layouts, website design, written content, marketing material, and downloadable content, is owned by or licensed to Zuppio Snacks Private Limited, unless mentioned otherwise.

Users may view website content for personal or informational purposes only. No content may be copied, reproduced, republished, uploaded, posted, transmitted, edited, sold, or used for commercial purposes without written consent from Zuppio Snacks Private Limited.

If any third-party content, image, or reference is used on the website, it remains the property of its respective owner.`,
    highlights: [
      "Website content is company-owned",
      "Personal viewing only allowed",
      "Copying without permission is prohibited",
      "Commercial use is restricted",
      "Third-party content belongs to owners"
    ]
  },
  {
    slug: "jurisdictions",
    view: "policies/jurisdictions",
    title: "Jurisdictions",
    preview: `Legal matters follow applicable local laws.`,
    badge: "09",
    detail:
      `These Terms & Conditions, Privacy Policy, Disclaimer, and other website-related matters shall be governed by the laws of India.

Any dispute, claim, or legal matter arising out of the use of this website, brand communication, product information, or related business interaction shall be subject to the jurisdiction of the competent courts located in Ghaziabad, Uttar Pradesh, India, unless otherwise required by applicable law.

Zuppio Snacks Private Limited reserves the right to take appropriate legal action in case of misuse of website content, brand assets, trademarks, copyrighted material, misleading representation, fraud, or violation of these terms.`,
    highlights: [
      "Governed by Indian laws",
      "Ghaziabad courts have jurisdiction",
      "Legal action may be taken for misuse",
      "Terms apply to all users",
      "Fraud or violations may face penalties"
    ]
  },
  
];

async function renderPage(req, res, view, title, activePage, extra = {}) {
  const adminState = await readState();
  const seoKey = extra.seoKey || "home";
  const seo = adminState.seo && adminState.seo[seoKey] ? adminState.seo[seoKey] : {};
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
    productCategories: adminState.productCategories || productCategories,
    productCategoryPage: adminState.productCategoryPage,
    homepage: adminState.homepage,
    contactPage: adminState.contactPage,
    aboutPage: adminState.aboutPage,
    howToBuyPage: adminState.howToBuyPage,
    responsiveSwiperSlides: adminState.swiperSlides.filter((slide) => slide.status === "Active"),
    managedBlogPosts: adminState.blogPosts.filter((post) => post.status === "Published"),
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

router.get("/flavors", function (_req, res) {
  res.redirect(301, "/product-categories");
});

router.get("/how-to-buy", async function (req, res) {
  await renderPage(req, res, "how-to-buy", "How To Buy | ZUPPIO", "How To Buy", {
    seoKey: "howToBuy"
  });
});

router.get("/blogs", async function (req, res) {
  await renderPage(req, res, "blogs", "Blogs | ZUPPIO", "Blogs", {
    seoKey: "blogs",
    pageHero: { breadcrumbTitle: "Blogs", commandTitle: "BLOG COMMAND CENTER", pageTitle: "BLOGS" }
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

router.post("/snack-drop-alerts", async function (req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const wantsJson = req.accepts(["json", "html"]) === "json";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const payload = { ok: false, message: "Please enter a valid email address." };
    return wantsJson ? res.status(400).json(payload) : res.status(400).send(payload.message);
  }

  try {
    await mutate((state) => {
      if (!state.subscribers.some((subscriber) => subscriber.email === email)) {
        const subscriber = { id: id("subscriber"), email, status: "Active", createdAt: now() };
        state.subscribers.unshift(subscriber);
        state.submissions.newsletter.unshift(subscriber);
      }
      state.analytics.newsletterSubscribers = state.subscribers.length;
    });
    await sendSnackDropConfirmation(email);
    await addAudit(email, "subscriber_create", "snack-drop", req);
    const payload = {
      ok: true,
      message: "Thank you for contacting us. We will get back to you soon."
    };
    return wantsJson ? res.json(payload) : res.redirect("/?snackDrop=sent");
  } catch (error) {
    console.error("Snack drop email failed:", error.message);
    const message =
      error.code === "EMAIL_CONFIG_MISSING"
        ? "Email service is not configured yet. Please try again later."
        : "We could not send the email right now. Please try again later.";
    const payload = { ok: false, message };
    return wantsJson ? res.status(503).json(payload) : res.status(503).send(payload.message);
  }
});

router.post("/contact", async function (req, res) {
  const name = String(req.body.name || "").trim().slice(0, 120);
  const email = String(req.body.email || "").trim().toLowerCase();
  const message = String(req.body.message || "").trim().slice(0, 2000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return res.status(400).json({ ok: false, message: "Please enter name, email, and message." });
  }

  await mutate((state) => {
    const inquiry = { id: id("inquiry"), name, email, message, type: "contact", status: "Unread", createdAt: now() };
    state.inquiries.unshift(inquiry);
    state.submissions.contacts.unshift(inquiry);
    state.analytics.contactSubmissions += 1;
  });
  await addAudit(email, "inquiry_create", "contact", req);
  res.json({ ok: true, message: "Thank you for contacting us. We will get back to you soon." });
});

router.post("/dealer-inquiries", async function (req, res) {
  const payload = {
    id: id("dealer"),
    name: String(req.body.name || "").trim().slice(0, 120),
    shop: String(req.body.shop || "").trim().slice(0, 160),
    phone: String(req.body.phone || "").trim().slice(0, 60),
    city: String(req.body.city || "").trim().slice(0, 120),
    business: String(req.body.business || "").trim().slice(0, 160),
    quantity: String(req.body.quantity || "").trim().slice(0, 120),
    status: "New",
    createdAt: now()
  };
  if (!payload.name || !payload.phone) return res.status(400).json({ ok: false, message: "Please enter name and phone number." });
  await mutate((state) => {
    state.submissions.dealerInquiries.unshift(payload);
  });
  await addAudit(payload.name, "dealer_inquiry_create", payload.phone, req);
  res.json({ ok: true, message: "Thank you. Our team will contact you soon." });
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
