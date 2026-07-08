const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const { productCategories, normalizeProductCategories } = require("./siteData");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "admin.json");
const MONGO_STATE_ID = "main";
const MONGO_COLLECTION = process.env.MONGODB_COLLECTION || "cms_state";
let mutationQueue = Promise.resolve();
let mongoClientPromise;

const ROLES = {
  "Super Admin": ["analytics", "content", "products", "categories", "media", "swiper", "users", "messages", "blog", "faqs", "settings", "audit"],
  Admin: ["analytics", "content", "products", "categories", "media", "swiper", "users", "messages", "blog", "faqs", "settings", "audit"],
  Editor: ["content", "products", "categories", "media", "swiper", "blog", "faqs"],
  Viewer: ["analytics"]
};

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function defaultHomepageFaqItems() {
  return [
    { question: "What is ZUPPIO Foods?", answer: "ZUPPIO Foods is a modern Indian FMCG brand focused on snacks, bold flavors, and everyday food products built for quality, taste, and trust." },
    { question: "What products does ZUPPIO offer?", answer: "ZUPPIO currently showcases Potato Chips and is preparing future categories such as Beverages, Biscuit, Banana Chips, Wafers, and Ready-To-Eat products." },
    { question: "Are ZUPPIO snacks made with quality ingredients?", answer: "Yes. ZUPPIO is built around quality ingredients, hygienic handling, consistent taste, and packaging that keeps products shelf-ready and consumer friendly." },
    { question: "Where can I buy ZUPPIO products?", answer: "You can contact the ZUPPIO team directly for current retail availability, distributor support, and product purchase information." },
    { question: "Does ZUPPIO offer wholesale or dealership opportunities?", answer: "Yes. Retailers, distributors, and business partners can contact ZUPPIO for wholesale, dealership, and bulk enquiry discussions." },
    { question: "How can I contact ZUPPIO?", answer: "You can reach ZUPPIO through the Contact page, WhatsApp, phone, email, or the official social media links listed on the website." },
    { question: "Are new ZUPPIO products coming soon?", answer: "Yes. ZUPPIO is developing new products across snack, beverage, bakery, wafer, banana chips, and ready-to-eat categories." },
    { question: "What makes ZUPPIO different from other snack brands?", answer: "ZUPPIO combines Indian taste energy, clean modern branding, quality-focused production, and a roadmap for multiple everyday food categories." },
    { question: "Can retailers partner with ZUPPIO?", answer: "Yes. Retailers can connect with ZUPPIO for product availability, retail supply, dealership enquiries, and future launch updates." },
    { question: "Does ZUPPIO have different product categories?", answer: "Yes. ZUPPIO has dedicated product category pages for Potato Chips, Beverages, Biscuit, Banana Chips, Wafers, and Ready-To-Eat products." },
    { question: "How can I stay updated about ZUPPIO launches?", answer: "You can follow ZUPPIO on social media, check the website, or subscribe to snack drop alerts from the homepage." },
    { question: "Is ZUPPIO available online?", answer: "Online availability may expand over time. For current purchase and supply options, contact the ZUPPIO team directly." }
  ];
}

function defaultBlogPosts() {
  return [
    {
      id: id("blog"),
      title: "The Story Behind ZUPPIO Snacks",
      slug: "story-behind-zuppio-snacks",
      description: "How ZUPPIO is building a modern Indian snack brand with bold taste and everyday trust.",
      category: "Brand Story",
      tags: ["brand", "snacks", "zuppio"],
      image: "/images/blogs/story-behind-zuppio-snacks.jpg",
      status: "Published",
      content: [
        "ZUPPIO began with a simple belief: everyday snacks should feel exciting, trustworthy, and easy to love. The brand brings together bold Indian flavor energy, modern packaging, and a growing vision for food products that fit naturally into daily routines.",
        "From potato chips to upcoming categories, ZUPPIO is shaping a product universe around taste, consistency, and consumer connection. Every pack is designed to feel familiar enough for daily snacking and fresh enough to stand out on the shelf.",
        "The long-term goal is bigger than one snack. ZUPPIO is building a food brand that can grow across multiple categories while keeping quality, clarity, and joyful taste at the center."
      ],
      seoTitle: "The Story Behind ZUPPIO Snacks",
      seoDescription: "Read the brand story behind ZUPPIO Snacks and its modern Indian FMCG vision."
    },
    {
      id: id("blog"),
      title: "Why Potato Chips Are India's Favorite Snack",
      slug: "why-potato-chips-are-indias-favorite-snack",
      description: "A look at why crispy potato chips work for tea breaks, parties, travel, and everyday cravings.",
      category: "Snack Culture",
      tags: ["potato chips", "india", "snacks"],
      image: "/images/blogs/why-potato-chips-are-indias-favorite-snack.jpg",
      status: "Published",
      content: [
        "Potato chips have a special place in Indian snacking because they fit almost every moment. They work with tea, movie nights, road trips, office breaks, and quick get-togethers.",
        "The best chips balance crunch, seasoning, and freshness. ZUPPIO's Potato Chips category is built around that simple pleasure: crisp texture with flavors that feel made for Indian snack moods.",
        "From classic salted to masala-led flavors, potato chips remain a favorite because they are easy to share, easy to carry, and instantly satisfying."
      ],
      seoTitle: "Why Potato Chips Are India's Favorite Snack",
      seoDescription: "Explore why potato chips remain one of India's most loved everyday snack choices."
    },
    {
      id: id("blog"),
      title: "5 Easy Snack Recipes with ZUPPIO Chips",
      slug: "easy-snack-recipes-with-zuppio-chips",
      description: "Quick food ideas using ZUPPIO chips for parties, evening snacks, and fun family moments.",
      category: "Recipes",
      tags: ["recipes", "chips", "party snacks"],
      image: "/images/blogs/easy-snack-recipes-with-zuppio-chips.jpg",
      status: "Published",
      content: [
        "ZUPPIO chips can do more than sit beside a cold drink. Try crushed chips over chaat for extra crunch, layer them into a quick sandwich, or use them as a topping for cheesy nacho-style plates.",
        "For parties, make a snack bowl with chips, chopped onion, tomato, coriander, lemon, and a little chaat masala. Serve immediately so the crunch stays lively.",
        "You can also use chips as a crispy side with burgers, rolls, and wraps. Keep it simple: bold crunch, fast prep, and no complicated kitchen work."
      ],
      seoTitle: "5 Easy Snack Recipes with ZUPPIO Chips",
      seoDescription: "Try quick and simple snack ideas using ZUPPIO chips for parties and everyday cravings."
    },
    {
      id: id("blog"),
      title: "How ZUPPIO Focuses on Quality and Taste",
      slug: "how-zuppio-focuses-on-quality-and-taste",
      description: "Inside the quality-first thinking behind ZUPPIO's ingredients, flavors, and packaging.",
      category: "Quality",
      tags: ["quality", "taste", "ingredients"],
      image: "/images/blogs/how-zuppio-focuses-on-quality-and-taste.jpg",
      status: "Published",
      content: [
        "Quality starts with clear choices. ZUPPIO focuses on ingredients, consistent taste, hygienic handling, and packaging that supports a reliable snacking experience.",
        "Taste is just as important as process. The brand works toward flavors that feel bold, balanced, and repeat-worthy, so each pack can become part of a consumer's regular snack routine.",
        "As ZUPPIO grows into more categories, this quality-first thinking will guide new launches across snacks, beverages, bakery ideas, and ready-to-eat formats."
      ],
      seoTitle: "How ZUPPIO Focuses on Quality and Taste",
      seoDescription: "Learn how ZUPPIO approaches quality, ingredients, taste, and packaging."
    },
    {
      id: id("blog"),
      title: "Best Snacks for Parties and Gatherings",
      slug: "best-snacks-for-parties-and-gatherings",
      description: "Snack planning ideas for game nights, house parties, family visits, and festive tables.",
      category: "Food Ideas",
      tags: ["party snacks", "gatherings", "food ideas"],
      image: "/images/blogs/best-snacks-for-parties-and-gatherings.jpg",
      status: "Published",
      content: [
        "Great party snacks should be easy to serve, easy to refill, and fun to eat. Chips, wafers, dips, quick chaat bowls, and bite-sized sides all work well because guests can enjoy them without slowing the conversation.",
        "ZUPPIO chips can sit at the center of a snack table with dips, sliced vegetables, masala peanuts, and small sandwiches. Add different textures so the table feels full and exciting.",
        "For larger gatherings, keep extra packs ready and open them in batches. Fresh crunch makes a simple snack spread feel much more premium."
      ],
      seoTitle: "Best Snacks for Parties and Gatherings",
      seoDescription: "Snack planning ideas for parties, gatherings, game nights, and family events."
    },
    {
      id: id("blog"),
      title: "Upcoming ZUPPIO Product Categories",
      slug: "upcoming-zuppio-product-categories",
      description: "A preview of ZUPPIO's future product universe across beverages, biscuits, wafers, banana chips, and ready-to-eat ideas.",
      category: "Product Updates",
      tags: ["categories", "launches", "future products"],
      image: "/images/product-categories/zuppio-category-desktop.png",
      status: "Published",
      content: [
        "ZUPPIO's roadmap includes more than potato chips. The brand is preparing dedicated category spaces for Beverages, Biscuit, Banana Chips, Wafers, and Ready-To-Eat ideas.",
        "These categories are marked as coming soon because product development, quality checks, packaging, and supply readiness all matter before a launch reaches consumers.",
        "Visitors can already explore each category page on the website. As products become ready, those pages can be updated from admin data with descriptions, banners, and product listings."
      ],
      seoTitle: "Upcoming ZUPPIO Product Categories",
      seoDescription: "Preview upcoming ZUPPIO categories including beverages, biscuits, wafers, banana chips, and ready-to-eat products."
    }
  ];
}

const blogImageMigrations = {
  "story-behind-zuppio-snacks": {
    image: "/images/blogs/story-behind-zuppio-snacks.jpg",
    oldImages: ["/images/home-hero-zuppio.png"]
  },
  "why-potato-chips-are-indias-favorite-snack": {
    image: "/images/blogs/why-potato-chips-are-indias-favorite-snack.jpg",
    oldImages: ["/images/categories/potato-chips.svg"]
  },
  "easy-snack-recipes-with-zuppio-chips": {
    image: "/images/blogs/easy-snack-recipes-with-zuppio-chips.jpg",
    oldImages: ["/images/yellow.png"]
  },
  "how-zuppio-focuses-on-quality-and-taste": {
    image: "/images/blogs/how-zuppio-focuses-on-quality-and-taste.jpg",
    oldImages: ["/images/zuppio-front.jpeg"]
  },
  "best-snacks-for-parties-and-gatherings": {
    image: "/images/blogs/best-snacks-for-parties-and-gatherings.jpg",
    oldImages: ["/images/purple.png"]
  }
};

function migrateDefaultBlogImages(blogPosts) {
  if (!Array.isArray(blogPosts)) return;
  blogPosts.forEach((post) => {
    const migration = blogImageMigrations[post.slug];
    if (!migration) return;
    if (!post.image || migration.oldImages.includes(post.image)) {
      post.image = migration.image;
    }
  });
}

function defaultState() {
  return {
    users: [],
    content: [
      { id: "homepage", title: "Homepage", body: "ZUPPIO is a premium modern snack brand with bold chips flavors and fresh snack drops.", status: "published" },
      { id: "about", title: "About Section", body: "ZUPPIO Snacks Private Limited creates energetic, modern snack experiences for India.", status: "published" },
      { id: "footer", title: "Footer Content", body: "Bold chips, clean design, and modern snack energy for India's next-gen crunch crowd.", status: "published" },
      { id: "terms", title: "Terms", body: "Website usage is governed by ZUPPIO terms and applicable law.", status: "published" },
      { id: "privacy", title: "Privacy Policy", body: "ZUPPIO respects visitor privacy and handles submitted data for lawful business purposes.", status: "published" },
      { id: "contact", title: "Contact Page", body: "Contact ZUPPIO for product, retail, distributor, and bulk order information.", status: "published" }
    ],
    products: [
      { id: id("product"), name: "Seedha Simple", flavour: "Classic Salted", price: "", packetSize: "", category: "Potato Chips", description: "Classic salted potato chips.", images: ["/images/yellow.png"], availability: "Available", offers: "", status: "Active" },
      { id: id("product"), name: "Mast Masaledar", flavour: "Masala", price: "", packetSize: "", category: "Potato Chips", description: "Bold Indian masala chips.", images: ["/images/purple.png"], availability: "Available", offers: "", status: "Active" },
      { id: id("product"), name: "Italian Tadka", flavour: "Italian Herbs", price: "", packetSize: "", category: "Potato Chips", description: "Italian-style chips with Indian energy.", images: ["/images/green.png"], availability: "Available", offers: "", status: "Active" }
    ],
    productCategories,
    productCategoryPage: defaultProductCategoryPage(),
    categories: productCategories.map((category) => ({
      id: category.id,
      name: category.name,
      tags: [],
      flavour: "",
      size: "",
      colour: "",
      variations: "",
      productType: category.name,
      status: category.status
    })),
    swiperSlides: [
      {
        id: "category-responsive-banner",
        title: "Product Category Responsive Banner",
        desktopImage: "/images/product-categories/zuppio-category-desktop.png",
        tabletImage: "/images/product-categories/zuppio-category-tablet.png",
        mobileImage: "/images/product-categories/zuppio-category-mobile.png",
        alt: "ZUPPIO product category city illustration",
        status: "Active"
      }
    ],
    media: [],
    inquiries: [],
    feedback: [],
    subscribers: [],
    blogPosts: defaultBlogPosts(),
    faqs: [
      { id: id("faq"), question: "Where can I buy ZUPPIO?", answer: "Contact the team for current retail and distributor availability.", order: 1 }
    ],
    settings: {
      websiteName: "ZUPPIO",
      brandName: "ZUPPIO",
      adminEmail: "zuppiosnacks176@gmail.com",
      contactEmail: "zuppiosnacks.pvt.ltd@gmail.com",
      contactNumber: "+91 7011992634",
      defaultWhatsAppNumber: "+91 7011992634",
      email: "zuppiosnacks.pvt.ltd@gmail.com",
      address: "A433, Sudamapuri, Vijay Nagar, Ghaziabad, Uttar Pradesh - 201001",
      instagram: "https://www.instagram.com/zuppiosnacks",
      twitter: "https://x.com/ZUPPIOSnacks",
      youtube: "https://www.youtube.com/@ZUPPIOsnacks",
      facebook: "",
      smtpHost: "",
      seoTitle: "ZUPPIO | Crunch Karo, Smile Karo.",
      seoDescription: "ZUPPIO is a premium modern snack brand with bold chips flavors and fresh snack drops.",
      logo: "/images/zuppio-navbar-logo.png",
      favicon: "",
      footerText: "Bold chips, clean design, and modern snack energy."
    },
    auditLogs: [],
    analytics: {
      visits: 0,
      productViews: 0,
      contactSubmissions: 0,
      dealerInquiries: 0,
      wholesaleInquiries: 0,
      newsletterSubscribers: 0,
      categoryClicks: 0,
      qrClicks: 0,
      whatsappClicks: 0,
      blogViews: 0,
      latestActivity: []
    },
    seo: defaultSeo(),
    homepage: defaultHomepage(),
    blogPage: defaultBlogPage(),
    header: defaultHeader(),
    footer: defaultFooter(),
    contactPage: defaultContactPage(),
    aboutPage: defaultAboutPage(),
    howToBuy: defaultHowToBuy(),
    howToBuyPage: defaultHowToBuyPage(),
    policies: defaultPolicies(),
    submissions: {
      contacts: [],
      dealerInquiries: [],
      wholesaleInquiries: [],
      newsletter: []
    }
  };
}

function defaultSeo() {
  return {
    home: { title: "ZUPPIO | Crunch Karo, Smile Karo.", description: "ZUPPIO is a premium modern snack brand with bold chips flavors and fresh snack drops.", ogImage: "/images/home-hero-zuppio.png", canonicalUrl: "", noindex: false },
    productCategories: { title: "Product Categories | ZUPPIO", description: "Explore ZUPPIO product categories, snacks, beverages, biscuits, wafers, and ready-to-eat ideas.", ogImage: "/images/product-categories/zuppio-category-desktop.png", canonicalUrl: "", noindex: false },
    howToBuy: { title: "Where To Buy ZUPPIO | ZUPPIO", description: "Find ZUPPIO buying options, nearby availability, WhatsApp ordering, distributor support, and dealer enquiries.", ogImage: "/images/logo1.png", canonicalUrl: "", noindex: false },
    blogs: { title: "Blogs | ZUPPIO", description: "Snack stories, product updates, and ZUPPIO flavor ideas.", ogImage: "/images/logo1.png", canonicalUrl: "", noindex: false },
    about: { title: "About | ZUPPIO", description: "Learn about ZUPPIO Snacks Private Limited and its FMCG vision.", ogImage: "/images/banner.jpeg", canonicalUrl: "", noindex: false },
    contact: { title: "Contact | ZUPPIO", description: "Contact ZUPPIO Snacks Private Limited for business enquiries and customer support.", ogImage: "/images/logo1.png", canonicalUrl: "", noindex: false },
    terms: { title: "Terms | ZUPPIO", description: "Read ZUPPIO terms, policies, privacy details, and legal information.", ogImage: "/images/logo1.png", canonicalUrl: "", noindex: false }
  };
}

function defaultHeader() {
  return {
    logo: "/images/zuppio-navbar-logo.png",
    navItems: [
      { label: "Home", href: "/", visible: true, order: 1 },
      { label: "Products", href: "/product-categories", visible: true, order: 2 },
      { label: "Where To Buy", href: "/how-to-buy", visible: true, order: 3 },
      { label: "Blogs", href: "/blogs", visible: true, order: 4 },
      { label: "About", href: "/about", visible: true, order: 5 },
      { label: "Contact", href: "/contact", visible: true, order: 6 },
      { label: "Term", href: "/terms", visible: true, order: 7 }
    ]
  };
}

function defaultBlogPage() {
  return {
    hero: {
      label: "OUR BLOGS",
      title: "ZUPPIO BITES",
      subtitle: "Discover tasty stories, snack ideas, and everything behind your favorite Zuppio snacks."
    },
    heroImageNote: "Hero artwork is fixed in the website design: left chips bowl and right ZUPPIO packet stay the same. Edit only the hero text fields above from admin."
  };
}

function defaultFooter() {
  return {
    brandName: "ZUPPIO",
    brandText: "Bold chips, clean design, and modern snack energy for India's next-gen crunch crowd.",
    phone: "+91 7011992634",
    email: "zuppiosnacks.pvt.ltd@gmail.com",
    whatsappLink: "https://wa.me/917011992634?text=Hello%20ZUPPIO%20Team%2C%20I%20want%20to%20know%20more%20about%20your%20products",
    copyrightText: "ZUPPIO Snacks Private Limited. All rights reserved.",
    backgroundImage: "/images/footer-chips-bg.png",
    exploreLinks: defaultHeader().navItems,
    socialLinks: [
      { label: "Instagram", url: "https://www.instagram.com/zuppiosnacks?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", icon: "/images/insta.png", visible: true },
      { label: "Twitter/X", url: "https://x.com/ZUPPIOSnacks", icon: "/images/twitter.png", visible: true },
      { label: "YouTube", url: "https://www.youtube.com/@ZUPPIOsnacks", icon: "/images/yt.png", visible: true },
      { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61589926595273&mibextid=rS40aB7S9Ucbxw6v", icon: "/images/facebook.png", visible: true }
    ]
  };
}

function defaultHomepage() {
  return {
    status: "published",
    hero: {
      label: "Premium Snack Brand",
      title: "Taste That bring Smile",
      subtitle: "Small-batch style chips with bold Indian flavor, crisp packaging, and a snack universe built for big cravings.",
      primaryButtonText: "Explore Products",
      primaryButtonLink: "/product-categories",
      secondaryButtonText: "Contact Team",
      secondaryButtonLink: "/contact",
      backgroundImageDesktop: "/images/home-hero-zuppio.png",
      backgroundImageTablet: "/images/home-hero-zuppio.png",
      backgroundImageMobile: "/images/home-hero-zuppio.jpeg",
      backgroundPosition: "center right",
      backgroundOverlay: 0
    },
    aboutPreview: {
      label: "About",
      title: "Premium crunch. Street-style soul.",
      cards: [
        { icon: "wheat", title: "Premium Ingredients", text: "Fresh potatoes and bold spices with a clean, consistent bite." },
        { icon: "package-check", title: "Hygienic Packaging", text: "Packed with safety, care, and shelf-ready snack appeal." },
        { icon: "flame", title: "Flavor Innovation", text: "Indian masala energy blended with modern snack moods." },
        { icon: "badge-check", title: "Trusted Quality", text: "Built for repeat crunches, retailer confidence, and everyday joy." }
      ]
    },
    categoryShowcase: {
      label: "PRODUCT CATEGORIES",
      title: "EXPLORE THE ZUPPIO PRODUCT UNIVERSE",
      cards: [
        { id: "potato-chips", name: "Potato Chips", image: "/images/categories/potato-chips.svg", description: "Aloo Snack packs with crisp potato crunch and signature ZUPPIO flavors.", status: "Available Now", badge: "Available Now", color: "yellow", link: "/product-categories/potato-chips" },
        { id: "banana-chips", name: "Banana Chips", image: "/images/product-categories/banana-chips-category-card.png", description: "Crunchy banana chips crafted for traditional and modern snacking.", status: "Coming Soon", badge: "Future Expansion", color: "green", link: "/product-categories/banana-chips" },
        { id: "wafers", name: "Wafers", image: "/images/product-categories/wafers-category-card.png", description: "Light and crispy wafer snacks with exciting flavor possibilities.", status: "Coming Soon", badge: "Future Expansion", color: "purple", link: "/product-categories/wafers" },
        { id: "ready-to-eat", name: "Ready-To-Eat", image: "/images/product-categories/ready-to-eat-category-card.png", description: "Convenient snack and meal solutions for everyday consumption.", status: "Coming Soon", badge: "Future Expansion", color: "green", link: "/product-categories/ready-to-eat" },
        { id: "biscuit", name: "Biscuit", image: "/images/product-categories/biscuit-category-lineup.png", description: "Cream, cookie, and baked biscuit varieties for every age group.", status: "Coming Soon", badge: "Future Expansion", color: "yellow", link: "/product-categories/biscuit" },
        { id: "beverages", name: "Beverages", image: "/images/categories/beverages.svg", description: "Refreshing drink options designed for future ZUPPIO expansion.", status: "Coming Soon", badge: "Future Expansion", color: "purple", link: "/product-categories/beverages" }
      ]
    },
    testimonials: {
      label: "Snack talk",
      title: "Crunch reviews with extra volume.",
      items: [
        { quote: "Mast Masaledar has that spicy theatre-seat energy. One pack disappears fast.", author: "Aarav, Delhi" },
        { quote: "Italian Tadka feels premium without losing the desi punch.", author: "Meera, Noida" },
        { quote: "Seedha Simple is the tea-break pack. Clean, crisp, easy favorite.", author: "Rohan, Ghaziabad" }
      ]
    },
    faqs: {
      label: "FAQ",
      title: "Questions before the next crunch?",
      items: defaultHomepageFaqItems()
    },
    newsletter: {
      label: "Snack drop alerts",
      title: "Get the next crunch in your inbox.",
      fieldLabel: "Email address",
      placeholder: "you@crunch.in"
    }
  };
}

function defaultContactPage() {
  return {
    hero: { breadcrumbTitle: "Contact", commandTitle: "CONTACT COMMAND CENTER", pageTitle: "CONTACT" },
    companyName: "ZUPPIO Snacks Private Limited",
    address: "A433, Sudamapuri, Vijay Nagar, Ghaziabad, Uttar Pradesh - 201001",
    phone: "+91 7011992634",
    email: "zuppiosnacks.pvt.ltd@gmail.com",
    whatsappTitle: "Chat with ZUPPIO Team",
    whatsappButtonText: "Open WhatsApp",
    whatsappLink: "https://wa.me/917011992634?text=Hello%20ZUPPIO%20Team%2C%20I%20want%20to%20know%20more%20about%20your%20products%20and%20dealership",
    socialCards: defaultFooter().socialLinks,
    qrCards: [
      { title: "Scan to Visit Our Location", image: "/images/address-qr.png", buttonText: "Open Google Maps", link: "https://www.google.com/maps/search/?api=1&query=A433%2C%20Sudamapuri%2C%20Vijay%20Nagar%2C%20Ghaziabad%2C%20Uttar%20Pradesh%20201001" },
      { title: "Scan to Chat on WhatsApp", image: "/images/whatsapp-qr.png", buttonText: "Open WhatsApp", link: "https://wa.me/917011992634?text=Hello%20ZUPPIO%20Team%2C%20I%20want%20to%20know%20more%20about%20your%20products%20and%20dealership" }
    ],
    formHeading: { label: "Message Portal", title: "Send a crunch signal." }
  };
}

function defaultProductCategoryPage() {
  return {
    overview: { label: "Categories", title: "Choose what you want to explore." },
    suggestionSlides: [
      { id: "suggestion-beverages", className: "banner-slide-1", label: "", title: "Product Banner 1", text: "", buttonText: "", buttonLink: "/product-categories/beverages", backgroundImage: "/images/product-categories/zuppio-slider-mast-masaledar-desktop.png", mobileBackgroundImage: "/images/product-categories/zuppio-slider-mast-masaledar-mobile.png", overlayStrength: 0, order: 1, status: "Active", images: ["/images/product-categories/zuppio-slider-mast-masaledar-desktop.png"], artClass: "" },
      { id: "suggestion-bakery", className: "banner-slide-2", label: "", title: "Seedha Simple ZUPPIO Banner", text: "", buttonText: "", buttonLink: "/product-categories/potato-chips", backgroundImage: "/images/product-categories/zuppio-slider-seedha-simple-desktop.png", mobileBackgroundImage: "/images/product-categories/zuppio-slider-seedha-simple-mobile.jpeg", overlayStrength: 0, order: 2, status: "Active", images: ["/images/product-categories/zuppio-slider-seedha-simple-desktop.png"], artClass: "" },
      { id: "suggestion-ready-to-eat", className: "banner-slide-3", label: "", title: "Code Crunch Repeat ZUPPIO Banner", text: "", buttonText: "", buttonLink: "/product-categories/potato-chips", backgroundImage: "/images/product-categories/zuppio-slider-code-crunch-desktop.png", mobileBackgroundImage: "/images/product-categories/zuppio-slider-code-crunch-mobile.png", overlayStrength: 0, order: 3, status: "Active", images: ["/images/product-categories/zuppio-slider-code-crunch-desktop.png"], artClass: "" },
      { id: "suggestion-potato-chips", className: "banner-slide-4", label: "", title: "Product Banner 4", text: "", buttonText: "", buttonLink: "/product-categories/potato-chips", backgroundImage: "/images/product-categories/zuppio-category-desktop.png", overlayStrength: 0, order: 4, status: "Active", images: ["/images/product-categories/zuppio-category-desktop.png"], artClass: "" }
    ],
    businessPanel: {
      label: "Business Enquiries",
      title: "Want product, retail, or distributor details?",
      text: "Contact the ZUPPIO team for available Aloo Snack packs and upcoming category information.",
      buttonText: "Contact Team",
      buttonLink: "/contact"
    }
  };
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeSuggestionSlide(slide, index) {
  const item = slide && typeof slide === "object" ? slide : {};
  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
  const backgroundImage = String(item.backgroundImage || images[0] || "").trim();
  const mobileBackgroundImage = String(item.mobileBackgroundImage || item.mobileImage || "").trim();
  const title = String(item.title || item.heading || "").trim();

  return {
    id: String(item.id || `suggestion-${index + 1}`).trim(),
    className: String(item.className || `suggestion-slide-${index + 1}`).trim(),
    label: String(item.label || "").trim(),
    title: title || `Product slide ${index + 1}`,
    text: String(item.text || item.description || item.subheading || "").trim(),
    buttonText: String(item.buttonText || item.ctaText || "").trim(),
    buttonLink: String(item.buttonLink || item.ctaLink || "/product-categories").trim(),
    backgroundImage,
    mobileBackgroundImage,
    overlayStrength: clampNumber(item.overlayStrength, 0, 0, 0.85),
    order: clampNumber(item.order, index + 1, 0, 9999),
    status: String(item.status || "Active").trim() || "Active",
    images,
    artClass: String(item.artClass || "").trim()
  };
}

function normalizeProductCategoryPage(page) {
  const item = page && typeof page === "object" ? page : defaultProductCategoryPage();
  const defaultSlides = defaultProductCategoryPage().suggestionSlides;
  const firstBanner = defaultSlides[0];
  const secondBanner = defaultSlides[1];
  const thirdBanner = defaultSlides[2];
  const legacySlideIds = new Set(["suggestion-1", "suggestion-2", "suggestion-3"]);
  const legacySlideTitles = new Set([
    "Beverages for every mood.",
    "Biscuits, wafers, and banana chips.",
    "Quick meals, ZUPPIO style."
  ]);
  item.suggestionSlides = (Array.isArray(item.suggestionSlides) ? item.suggestionSlides : [])
    .filter((slide) => {
      if (!slide || typeof slide !== "object") return false;
      return !legacySlideIds.has(slide.id) && !legacySlideTitles.has(slide.title);
    });
  item.suggestionSlides = item.suggestionSlides.map((slide) => {
    if (
      slide &&
      slide.id === "suggestion-beverages" &&
      (!slide.mobileBackgroundImage || slide.backgroundImage === "/images/categories/beverages.svg")
    ) {
      return {
        ...slide,
        title: "Mast Masaledar ZUPPIO Banner",
        label: "",
        text: "",
        buttonText: "",
        buttonLink: "/product-categories/potato-chips",
        backgroundImage: firstBanner.backgroundImage,
        mobileBackgroundImage: firstBanner.mobileBackgroundImage,
        overlayStrength: 0,
        images: [...firstBanner.images]
      };
    }
    if (
      slide &&
      slide.id === "suggestion-bakery" &&
      (!slide.mobileBackgroundImage || slide.backgroundImage === "/images/categories/biscuit.svg")
    ) {
      return {
        ...slide,
        title: "Seedha Simple ZUPPIO Banner",
        label: "",
        text: "",
        buttonText: "",
        buttonLink: "/product-categories/potato-chips",
        backgroundImage: secondBanner.backgroundImage,
        mobileBackgroundImage: secondBanner.mobileBackgroundImage,
        overlayStrength: 0,
        images: [...secondBanner.images]
      };
    }
    if (
      slide &&
      slide.id === "suggestion-ready-to-eat" &&
      (!slide.mobileBackgroundImage || slide.backgroundImage === "/images/categories/ready-to-eat.svg")
    ) {
      return {
        ...slide,
        title: "Code Crunch Repeat ZUPPIO Banner",
        label: "",
        text: "",
        buttonText: "",
        buttonLink: "/product-categories/potato-chips",
        backgroundImage: thirdBanner.backgroundImage,
        mobileBackgroundImage: thirdBanner.mobileBackgroundImage,
        overlayStrength: 0,
        images: [...thirdBanner.images]
      };
    }
    return slide;
  });
  const existingSlideIds = new Set(item.suggestionSlides.map((slide) => slide && slide.id));
  defaultSlides.forEach((slide) => {
    if (!existingSlideIds.has(slide.id)) {
      if (!Array.isArray(item.suggestionSlides)) item.suggestionSlides = [];
      item.suggestionSlides.push({ ...slide });
    }
  });
  item.suggestionSlides = (Array.isArray(item.suggestionSlides) ? item.suggestionSlides : [])
    .map(normalizeSuggestionSlide)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  return item;
}

function defaultAboutPage() {
  return {
    hero: { breadcrumbTitle: "About", commandTitle: "ABOUT COMMAND CENTER", pageTitle: "ABOUT ZUPPIO" },
    intro: {
      label: "About ZUPPIO",
      title: "Creating Everyday Food Brands for Modern India",
      paragraphs: [
        "Zuppio Snacks Pvt. Ltd. is an emerging Indian FMCG company focused on developing high-quality food, snack, and beverage products for consumers across the country.",
        "Built on a foundation of quality, innovation, and consumer trust, Zuppio aims to deliver products that fit seamlessly into everyday lifestyles. From savory snacks and namkeen to future beverage and food categories, our goal is to create brands that consumers choose and trust every day.",
        "At Zuppio, we combine consumer insights, modern manufacturing practices, and strong quality standards to build products that offer great taste, consistency, and value."
      ],
      image: "/images/banner.jpeg"
    },
    whoWeAre: {
      label: "Who We Are",
      title: "An Emerging FMCG Company with a Long-Term Vision",
      paragraphs: [
        "Zuppio was founded with the ambition of building more than a snack brand. We are creating a diversified FMCG business focused on understanding evolving consumer needs and delivering products that improve everyday experiences.",
        "As we grow, our product portfolio will expand across multiple food and beverage categories, supported by strong distribution, innovative packaging, and customer-focused product development."
      ],
      featureCards: [
        { icon: "wheat", title: "Premium Ingredients", text: "Fresh potatoes and bold spices." },
        { icon: "settings-2", title: "Modern Processing", text: "Consistency, care, and quality." },
        { icon: "package-check", title: "Hygienic Packaging", text: "Safety-led pack handling." },
        { icon: "sparkles", title: "Taste Innovation", text: "Local flavors, modern moods." }
      ]
    },
    story: {
      label: "Our Story",
      title: "Built From a Vision to Create Trusted Consumer Brands",
      quote: "Every successful brand starts with a simple belief.",
      paragraphs: [
        "For us, that belief was that consumers deserve quality products at affordable prices without compromising on taste, safety, or experience.",
        "What started as a vision to create great snacks has evolved into a larger mission - to build a trusted FMCG company that serves millions of consumers through innovative products and strong brand values.",
        "Today, Zuppio continues to invest in product development, quality systems, and consumer understanding as we work toward becoming a recognized name in India's FMCG industry."
      ]
    },
    mission: { label: "Our Mission", title: "Deliver Quality Products That Consumers Trust", text: "Our mission is to create accessible, high-quality food and beverage products that combine taste, innovation, safety, and value while building long-term relationships with consumers." },
    vision: { label: "Our Vision", title: "Building One of India's Most Trusted FMCG Companies", text: "Our vision is to become a leading Indian FMCG organization recognized for innovation, product excellence, consumer trust, and sustainable business growth across multiple categories." },
    values: {
      label: "Our Values",
      title: "The standards behind every pack.",
      cards: [
        { icon: "badge-check", title: "Quality First", text: "Every product is developed with a commitment to consistency and consumer satisfaction." },
        { icon: "users", title: "Consumer Focus", text: "Understanding consumer needs drives every decision we make." },
        { icon: "lightbulb", title: "Innovation", text: "We continuously explore new ideas, flavors, formats, and opportunities." },
        { icon: "shield-check", title: "Integrity", text: "We believe in responsible business practices and long-term trust." },
        { icon: "trending-up", title: "Growth Mindset", text: "We are committed to building brands that create lasting value for consumers, partners, and communities." }
      ]
    }
  };
}

function defaultHowToBuy() {
  return {
    hero: { breadcrumbTitle: "How To Buy", commandTitle: "STORE FINDER", pageTitle: "WHERE TO BUY ZUPPIO" },
    filters: {
      bannerImage: "/images/logo1.png",
      pincodePlaceholder: "Enter pincode",
      categories: ["Any", "Potato Chips", "Banana Chips", "Wafers", "Biscuits", "Beverages", "Ready-To-Eat"],
      products: ["All products", "Seedha Simple", "Italian Tadka", "Mast Masaledar"],
      radii: ["Within 2 km", "Within 5 km", "Within 10 km", "Within 25 km"],
      findButtonText: "Find ZUPPIO"
    },
    map: {
      title: "Delhi NCR Availability Zone",
      locationLabel: "Noida / Delhi NCR",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=ZUPPIO%20snacks%20Noida%20Delhi%20NCR",
      defaultQuery: "Noida Delhi NCR",
      defaultCenter: { lat: 28.5355, lng: 77.391, zoom: 11 },
      apiMissingMessage: "Map API key is not configured.",
      noStoresMessage: "No ZUPPIO stores found in this area yet. Please contact us on WhatsApp for availability."
    },
    stores: [
      {
        id: "store-ghaziabad-201002",
        name: "ZUPPIO Ghaziabad Retail Partner",
        address: "Vijay Nagar market area, Ghaziabad, Uttar Pradesh",
        city: "Ghaziabad",
        pincode: "201002",
        phone: "+91 7011992634",
        latitude: 28.6697,
        longitude: 77.4256,
        products: ["Seedha Simple", "Italian Tadka"],
        categories: ["Potato Chips"],
        type: "Retailer",
        status: "Available"
      },
      {
        id: "store-noida-201301",
        name: "ZUPPIO Noida Retail Desk",
        address: "Sector 18, Noida, Uttar Pradesh",
        city: "Noida",
        pincode: "201301",
        phone: "+91 7011992634",
        latitude: 28.5672,
        longitude: 77.321,
        products: ["Seedha Simple", "Mast Masaledar"],
        categories: ["Potato Chips"],
        type: "Retailer",
        status: "Available"
      },
      {
        id: "store-noida-201309",
        name: "ZUPPIO Sector 62 Partner Store",
        address: "Sector 62, Noida, Uttar Pradesh",
        city: "Noida",
        pincode: "201309",
        phone: "+91 7011992634",
        latitude: 28.627,
        longitude: 77.375,
        products: ["Seedha Simple", "Italian Tadka", "Mast Masaledar"],
        categories: ["Potato Chips"],
        type: "Retailer",
        status: "Available"
      },
      {
        id: "store-ghaziabad-201001",
        name: "ZUPPIO Direct NCR Hub",
        address: "A433, Sudamapuri, Vijay Nagar, Ghaziabad, Uttar Pradesh",
        city: "Ghaziabad",
        pincode: "201001",
        phone: "+91 7011992634",
        latitude: 28.6643,
        longitude: 77.431,
        products: ["Seedha Simple", "Italian Tadka", "Mast Masaledar"],
        categories: ["Potato Chips"],
        type: "Distributor",
        status: "Available"
      },
      {
        id: "store-delhi-110092",
        name: "Delhi NCR Distributor Network",
        address: "Patparganj industrial area, East Delhi",
        city: "Delhi",
        pincode: "110092",
        phone: "+91 7011992634",
        latitude: 28.6219,
        longitude: 77.3121,
        products: ["Seedha Simple", "Italian Tadka", "Mast Masaledar"],
        categories: ["Potato Chips"],
        type: "Distributor",
        status: "Available"
      },
      {
        id: "store-wholesale-ncr",
        name: "ZUPPIO Wholesale Orders",
        address: "Delhi NCR wholesale supply desk",
        city: "Noida",
        pincode: "201305",
        phone: "+91 7011992634",
        latitude: 28.5024,
        longitude: 77.4052,
        products: ["Seedha Simple", "Italian Tadka", "Mast Masaledar"],
        categories: ["Potato Chips"],
        type: "Wholesale",
        status: "Available"
      }
    ],
    tabs: [
      { id: "nearby-stores", label: "Nearby Stores" },
      { id: "online", label: "Online" },
      { id: "distributors", label: "Distributors" },
      { id: "wholesale", label: "Wholesale" },
      { id: "dealer-inquiry", label: "Dealer Inquiry" }
    ],
    buyingOptions: [
      { tab: "nearby-stores", icon: "store", name: "Local Retail Stores", type: "Pickup", status: "Expanding", buttonText: "View Products", link: "/product-categories" },
      { tab: "nearby-stores", image: "/images/logo1.png", name: "ZUPPIO Direct", type: "Delivery", status: "Available", buttonText: "Contact", link: "/contact" },
      { tab: "online", icon: "message-circle", name: "WhatsApp Order", type: "Delivery", status: "Available", buttonText: "Contact", link: "https://wa.me/917011992634?text=Hello%20ZUPPIO%20Team%2C%20I%20want%20to%20order%20ZUPPIO%20products" },
      { tab: "online", icon: "shopping-bag", name: "Future Online Partners", type: "Online", status: "Coming Soon", buttonText: "View Products", link: "/product-categories" },
      { tab: "distributors", icon: "truck", name: "Distributor Network", type: "Distributor", status: "Open", buttonText: "Contact", link: "/contact" },
      { tab: "wholesale", icon: "boxes", name: "Wholesale Orders", type: "Wholesale", status: "Available", buttonText: "Contact", link: "/contact" },
      { tab: "dealer-inquiry", icon: "handshake", name: "Dealer Inquiry", type: "Dealer", status: "Open", buttonText: "Contact", link: "#dealer-inquiry" }
    ],
    dealerInquiry: {
      label: "Partner With ZUPPIO",
      title: "Become a ZUPPIO Dealer",
      description: "Share your business details and the ZUPPIO team will contact you for dealership, distributor, retail, or wholesale opportunities.",
      businessTypes: ["Retailer", "Distributor", "Wholesaler", "Super Stockist", "Modern Trade", "Online Seller", "Other"],
      submitButtonText: "Submit Inquiry"
    }
  };
}

function defaultHowToBuyPage() {
  return defaultHowToBuy();
}

function defaultPolicies() {
  return {
    hero: { breadcrumbTitle: "Terms & Conditions", commandTitle: "LEGAL COMMAND CENTER", pageTitle: "TERMS & CONDITIONS" },
    items: [
      {
        slug: "acceptance",
        title: "Accuracy & Acceptance of Terms",
        preview: "By using the ZUPPIO website, you agree to these terms and all related policies.",
        detail: "Welcome to the official website of Zuppio Snacks Private Limited operating under the brand name Zuppio.\n\nBy accessing, browsing, or using this website, you agree to follow and be bound by these Terms & Conditions, Privacy Policy, Disclaimer, and all applicable laws and regulations. If you do not agree with any part of these terms, you should not use this website.\n\nWe make reasonable efforts to keep the information on this website accurate, updated, and complete. However, product details, packaging, flavours, prices, availability, offers, images, and other information may change from time to time without prior notice.\n\nZuppio Snacks Private Limited reserves the right to update, modify, suspend, or remove any content from this website at any time. Continued use of the website after changes means you accept the updated terms.",
        highlights: ["Website use means acceptance of all policies", "Do not use the website if you disagree", "Product and website information may change", "Content may be updated or removed without notice", "Continued use means acceptance of updated terms"]
      },
      {
        slug: "privacy",
        title: "Privacy & Policies",
        preview: "Learn how Zuppio collects, uses, protects, and lawfully shares information submitted through the website.",
        detail: "At Zuppio Snacks Private Limited, we respect your privacy and are committed to protecting the personal information shared by users, customers, distributors, retailers, vendors, and visitors through our website.\n\nWe may collect basic information such as your name, mobile number, email address, city, business details, enquiry details, feedback, and other information voluntarily submitted through forms, calls, emails, WhatsApp, or website interactions.\n\nThis information may be used for:\n\nCustomer support and enquiry response\nDistributor, retailer, or business communication\nProduct feedback and service improvement\nMarketing communication, only where legally permitted\nOrder, supply, or business-related coordination\nWebsite performance and user experience improvement\n\nWe do not sell your personal information to third parties. We may share information only with trusted service providers, business partners, legal authorities, or internal teams when required for lawful business purposes.\n\nUsers may contact us to request correction, update, or deletion of their personal information, subject to applicable law and business/legal record requirements. The DPDP framework emphasizes lawful purpose, consent, transparency, data minimization, and user rights such as correction and erasure.\n\nContact for privacy-related queries:\nEmail: zuppiosnacks.pvt.ltd@gmail.com\nAddress: A433, Sudamapuri, Vijay Nagar, Ghaziabad, Uttar Pradesh - 201001",
        highlights: ["Voluntarily submitted personal data may be collected", "Information supports enquiries, business communication, and improvement", "Personal data is not sold", "Sharing is limited to lawful business or legal needs", "Users may request correction, updates, or deletion"]
      },
      {
        slug: "disclaimer",
        title: "Disclaimer & Limitations / Use of Site",
        preview: "Website content is provided for general information, and users must use the platform lawfully and responsibly.",
        detail: "The content available on this website is provided for general information, brand awareness, product information, business enquiries, and customer communication purposes only.\n\nWhile we try to provide accurate and updated information, Zuppio Snacks Private Limited does not guarantee that the website will always be error-free, uninterrupted, fully updated, or free from technical issues.\n\nProduct images shown on the website are for representation purposes only. Actual product packaging, colour, weight, appearance, design, or availability may vary due to printing, manufacturing, supply chain, or design updates.\n\nUsers agree not to misuse this website in any way, including but not limited to:\n\nCopying website content without permission\nUploading harmful code, spam, or malware\nMisrepresenting identity or business details\nUsing the website for illegal or fraudulent purposes\nDamaging, disabling, or interfering with website operations\nUsing brand assets, images, or product information without written approval\n\nZuppio Snacks Private Limited shall not be liable for any direct, indirect, incidental, consequential, or business loss arising from the use or inability to use this website, reliance on website content, technical errors, third-party links, or changes in product information.",
        highlights: ["Content is for general information only", "Accuracy and uninterrupted access are not guaranteed", "Product images and details may vary", "Illegal, harmful, or unauthorized use is prohibited", "Company liability is limited for website-related losses"]
      },
      {
        slug: "Trademarks",
        title: "Trademarks",
        preview: "All trademarks, logos, and brand elements displayed on this website are the property of Zuppio Snacks Private Limited.",
        detail: "The name Zuppio, brand logo, product names, flavour names, packaging designs, taglines, graphics, icons, labels, slogans, and other brand elements displayed on this website are the property of Zuppio Snacks Private Limited, unless otherwise stated.\n\nNo visitor, retailer, distributor, agency, vendor, or third party is allowed to use, reproduce, copy, modify, publish, distribute, advertise, or commercially exploit any Zuppio trademark, brand name, design, or logo without prior written permission from the company.\n\nAny unauthorized use of our brand identity may lead to legal action under applicable trademark and intellectual property laws.",
        highlights: ["Zuppio brand elements belong to the company", "Reproduction or commercial use requires written permission", "Restrictions apply to visitors and business partners", "Unauthorized brand use is prohibited", "Trademark misuse may result in legal action"]
      },
      {
        slug: "copyright",
        title: "Copyrights",
        preview: "Zuppio website content is protected and may only be used for permitted personal or informational purposes.",
        detail: "All content on this website, including text, images, product photos, packaging designs, graphics, videos, illustrations, layouts, website design, written content, marketing material, and downloadable content, is owned by or licensed to Zuppio Snacks Private Limited, unless mentioned otherwise.\n\nUsers may view website content for personal or informational purposes only. No content may be copied, reproduced, republished, uploaded, posted, transmitted, edited, sold, or used for commercial purposes without written consent from Zuppio Snacks Private Limited.\n\nIf any third-party content, image, or reference is used on the website, it remains the property of its respective owner.",
        highlights: ["Website content is owned by or licensed to Zuppio", "Viewing is limited to personal or informational purposes", "Copying or republication requires written consent", "Commercial use requires written consent", "Third-party content remains with its owner"]
      },
      {
        slug: "jurisdictions",
        title: "Jurisdiction",
        preview: "Website-related legal matters are governed by Indian law and the competent courts in Ghaziabad.",
        detail: "These Terms & Conditions, Privacy Policy, Disclaimer, and other website-related matters shall be governed by the laws of India.\n\nAny dispute, claim, or legal matter arising out of the use of this website, brand communication, product information, or related business interaction shall be subject to the jurisdiction of the competent courts located in Ghaziabad, Uttar Pradesh, India, unless otherwise required by applicable law.\n\nZuppio Snacks Private Limited reserves the right to take appropriate legal action in case of misuse of website content, brand assets, trademarks, copyrighted material, misleading representation, fraud, or violation of these terms.",
        highlights: ["Governed by Indian laws", "Ghaziabad courts have jurisdiction", "Applies to website, brand, product, and business interactions", "Legal action may be taken for content or intellectual-property misuse", "Fraud, misleading representation, and violations may be pursued"]
      }
    ]
  };
}

function mergeDefaults(state, defaults) {
  if (Array.isArray(defaults)) return Array.isArray(state) ? state : defaults;
  if (!defaults || typeof defaults !== "object") return state === undefined ? defaults : state;
  const output = state && typeof state === "object" && !Array.isArray(state) ? state : {};
  Object.keys(defaults).forEach((key) => {
    output[key] = mergeDefaults(output[key], defaults[key]);
  });
  return output;
}

function normalizeState(state) {
  const merged = mergeDefaults(state, defaultState());
  merged.productCategories = normalizeProductCategories(merged.productCategories);
  merged.productCategoryPage = normalizeProductCategoryPage(merged.productCategoryPage);
  if (!merged.submissions) merged.submissions = { contacts: [], dealerInquiries: [], newsletter: [] };
  if (!merged.submissions.contacts) merged.submissions.contacts = merged.inquiries || [];
  if (!merged.submissions.newsletter) merged.submissions.newsletter = merged.subscribers || [];
  if (!merged.submissions.dealerInquiries) merged.submissions.dealerInquiries = [];
  if (!merged.submissions.wholesaleInquiries) merged.submissions.wholesaleInquiries = [];
  if (!merged.submissions.contacts.length && merged.inquiries.length) merged.submissions.contacts = [...merged.inquiries];
  if (!merged.inquiries.length && merged.submissions.contacts.length) merged.inquiries = [...merged.submissions.contacts];
  merged.submissions.contacts.forEach((item) => {
    if (!item.status || item.status === "Unread") item.status = "New";
  });
  merged.submissions.dealerInquiries.forEach((item) => {
    if (!item.status || item.status === "Unread") item.status = "New";
  });
  merged.submissions.wholesaleInquiries.forEach((item) => {
    if (!item.status || item.status === "Unread") item.status = "New";
  });
  merged.analytics.contactSubmissions = merged.submissions.contacts.length;
  merged.analytics.dealerInquiries = merged.submissions.dealerInquiries.length;
  merged.analytics.wholesaleInquiries = merged.submissions.wholesaleInquiries.length;
  merged.analytics.newsletterSubscribers = merged.submissions.newsletter.length;
  migrateDefaultBlogImages(merged.blogPosts);
  return merged;
}

function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI);
}

function mongoDbName() {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;
  try {
    const parsed = new URL(process.env.MONGODB_URI);
    const pathname = parsed.pathname.replace(/^\//, "");
    return pathname || "zuppio";
  } catch (_error) {
    return "zuppio";
  }
}

async function mongoCollection() {
  if (!hasMongoUri()) return null;
  if (!mongoClientPromise) {
    mongoClientPromise = MongoClient.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    }).catch((error) => {
      mongoClientPromise = null;
      throw error;
    });
  }
  const client = await mongoClientPromise;
  return client.db(mongoDbName()).collection(MONGO_COLLECTION);
}

async function readJsonState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return normalizeState(JSON.parse(await fs.readFile(STORE_PATH, "utf8")));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const state = normalizeState(defaultState());
    await writeJsonState(state);
    return state;
  }
}

async function writeJsonState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporaryPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(state, null, 2));
  await fs.rename(temporaryPath, STORE_PATH);
}

async function readState() {
  if (hasMongoUri()) {
    try {
      const collection = await mongoCollection();
      const document = await collection.findOne({ _id: MONGO_STATE_ID });
      if (document && document.state) return normalizeState(document.state);

      const state = await readJsonState();
      await collection.updateOne(
        { _id: MONGO_STATE_ID },
        { $set: { state, updatedAt: now() }, $setOnInsert: { createdAt: now() } },
        { upsert: true }
      );
      return state;
    } catch (error) {
      console.error("MongoDB CMS store unavailable, using JSON fallback:", error.message);
    }
  }

  return readJsonState();
}

async function writeState(state) {
  const normalized = normalizeState(state);

  if (hasMongoUri()) {
    try {
      const collection = await mongoCollection();
      await collection.updateOne(
        { _id: MONGO_STATE_ID },
        { $set: { state: normalized, updatedAt: now() }, $setOnInsert: { createdAt: now() } },
        { upsert: true }
      );
    } catch (error) {
      console.error("MongoDB CMS write failed, preserving JSON fallback:", error.message);
    }
  }

  await writeJsonState(normalized);
}

async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "zuppiosnacks176@gmail.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe@12345";
  await mutate(async (state) => {
    if (state.users.some((user) => user.email === email)) return;
    state.users.push({
      id: id("user"),
      name: "ZUPPIO Super Admin",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "Super Admin",
      status: "Active",
      createdAt: now(),
      lastLoginAt: ""
    });
    state.auditLogs.unshift({ id: id("audit"), action: "seed_admin", actor: "system", target: email, createdAt: now(), ip: "" });
  });
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function mutate(mutator) {
  const operation = mutationQueue.then(async () => {
    const state = await readState();
    const result = await mutator(state);
    await writeState(state);
    return result;
  });
  mutationQueue = operation.catch(() => undefined);
  return operation;
}

async function addAudit(actor, action, target, req) {
  await mutate((state) => {
    const entry = { id: id("audit"), actor: actor || "system", action, target: target || "", ip: req ? req.ip : "", createdAt: now() };
    state.auditLogs.unshift(entry);
    state.auditLogs = state.auditLogs.slice(0, 300);
    state.analytics.latestActivity.unshift(entry);
    state.analytics.latestActivity = state.analytics.latestActivity.slice(0, 20);
  });
}

function can(role, permission) {
  return Boolean(ROLES[role] && ROLES[role].includes(permission));
}

async function recordVisit(req) {
  if (req.path.startsWith("/admin") || req.path.startsWith("/images") || req.path.startsWith("/css") || req.path.startsWith("/javascripts")) return;
  await mutate((state) => {
    state.analytics.visits += 1;
    if (req.path.includes("product-categories")) state.analytics.productViews += 1;
  });
}

module.exports = {
  ROLES,
  STORE_PATH,
  addAudit,
  can,
  ensureAdminUser,
  id,
  mutate,
  now,
  publicUser,
  readState,
  recordVisit,
  writeState
};
