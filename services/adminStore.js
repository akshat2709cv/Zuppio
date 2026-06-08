const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { productCategories, normalizeProductCategories } = require("./siteData");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "admin.json");

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
      image: "/images/home-hero-zuppio.png",
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
      image: "/images/categories/potato-chips.svg",
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
      image: "/images/yellow.png",
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
      image: "/images/zuppio-front.jpeg",
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
      image: "/images/purple.png",
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
      newsletterSubscribers: 0,
      categoryClicks: 0,
      qrClicks: 0,
      whatsappClicks: 0,
      blogViews: 0,
      latestActivity: []
    },
    seo: defaultSeo(),
    homepage: defaultHomepage(),
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
      mainImage: "/images/purple.png",
      leftImage: "/images/yellow.png",
      rightImage: "/images/green.png"
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
        { id: "banana-chips", name: "Banana Chips", image: "/images/categories/banana-chips.svg", description: "Crunchy banana chips crafted for traditional and modern snacking.", status: "Coming Soon", badge: "Future Expansion", color: "green", link: "/product-categories/banana-chips" },
        { id: "wafers", name: "Wafers", image: "/images/categories/wafers.svg", description: "Light and crispy wafer snacks with exciting flavor possibilities.", status: "Coming Soon", badge: "Future Expansion", color: "purple", link: "/product-categories/wafers" },
        { id: "ready-to-eat", name: "Ready-To-Eat", image: "/images/categories/ready-to-eat.svg", description: "Convenient snack and meal solutions for everyday consumption.", status: "Coming Soon", badge: "Future Expansion", color: "green", link: "/product-categories/ready-to-eat" },
        { id: "biscuit", name: "Biscuit", image: "/images/categories/biscuit.svg", description: "Cream, cookie, and baked biscuit varieties for every age group.", status: "Coming Soon", badge: "Future Expansion", color: "yellow", link: "/product-categories/biscuit" },
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
      { className: "beverage-slide", label: "Coming Soon", title: "Beverages for every mood.", text: "Zeera Drinks, Energy Drinks, Tighter Drinks, Water, and Aam Papad are planned for the next ZUPPIO shelf.", buttonText: "See Beverages", buttonLink: "/product-categories/beverages", images: ["/images/categories/beverages.svg"], artClass: "category-art" },
      { className: "bakery-slide", label: "Future Crunch", title: "Biscuits, wafers, and banana chips.", text: "Baked biscuits, cream biscuits, cookies, wafer biscuits, banana chips, and flavored wafers are mapped for future launches.", buttonText: "Explore Bakery", buttonLink: "/product-categories/biscuit", images: ["/images/categories/biscuit.svg", "/images/categories/wafers.svg"], artClass: "combo-art" },
      { className: "ready-slide", label: "Ready-To-Eat", title: "Quick meals, ZUPPIO style.", text: "Poha, Rajma Chawal, Noodles, and Creamy Chai Coffee ideas for fast everyday use.", buttonText: "View Ready-To-Eat", buttonLink: "/product-categories/ready-to-eat", images: ["/images/categories/ready-to-eat.svg"], artClass: "category-art" }
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
      { slug: "acceptance", title: "Accuracy & Acceptance of Terms", preview: "By using ZUPPIO, you agree to our digital snack universe rules.", detail: "Welcome to the official website of Zuppio Snacks Private Limited operating under the brand name Zuppio.\n\nBy accessing, browsing, or using this website, you agree to follow and be bound by these Terms & Conditions, Privacy Policy, Disclaimer, and all applicable laws and regulations.", highlights: ["Website use means acceptance of terms", "Information may change anytime", "Product details may vary"] },
      { slug: "privacy", title: "Privacy & Policies", preview: "Your privacy is important to us. By using this website.", detail: "At Zuppio Snacks Private Limited, we respect your privacy and are committed to protecting the personal information shared through our website.", highlights: ["Basic user data may be collected", "Personal data is not sold", "Users may request data correction or deletion"] },
      { slug: "disclaimer", title: "Disclaimer & Limitations or Uses of Site", preview: "All content is provided as available without guarantees.", detail: "The content available on this website is provided for general information, brand awareness, product information, business enquiries, and customer communication purposes only.", highlights: ["Content is for general information only", "Website may contain errors", "Website misuse is prohibited"] },
      { slug: "Trademarks", title: "Trademarks", preview: "All trademarks, logos, and brand elements displayed on this website are the property of Zuppio Snacks Private Limited.", detail: "The name Zuppio, brand logo, product names, flavour names, packaging designs, taglines, graphics, icons, labels, slogans, and other brand elements displayed on this website are the property of Zuppio Snacks Private Limited.", highlights: ["Zuppio brand assets are protected", "Unauthorized use is prohibited", "Written permission is required"] },
      { slug: "copyright", title: "Copyright", preview: "Original content belongs to the ZUPPIO brand and identity is officially protected.", detail: "All content on this website, including text, images, product photos, packaging designs, graphics, videos, illustrations, layouts, website design, written content, marketing material, and downloadable content, is owned by or licensed to Zuppio Snacks Private Limited.", highlights: ["Website content is company-owned", "Copying without permission is prohibited", "Commercial use is restricted"] },
      { slug: "jurisdictions", title: "Jurisdictions", preview: "Legal matters follow applicable local laws.", detail: "These Terms & Conditions, Privacy Policy, Disclaimer, and other website-related matters shall be governed by the laws of India.", highlights: ["Governed by Indian laws", "Ghaziabad courts have jurisdiction", "Legal action may be taken for misuse"] }
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
  if (!merged.submissions) merged.submissions = { contacts: [], dealerInquiries: [], newsletter: [] };
  if (!merged.submissions.contacts) merged.submissions.contacts = merged.inquiries || [];
  if (!merged.submissions.newsletter) merged.submissions.newsletter = merged.subscribers || [];
  if (!merged.submissions.dealerInquiries) merged.submissions.dealerInquiries = [];
  if (!merged.submissions.wholesaleInquiries) merged.submissions.wholesaleInquiries = [];
  return merged;
}

async function readState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const state = normalizeState(JSON.parse(await fs.readFile(STORE_PATH, "utf8")));
    await writeState(state);
    return state;
  } catch (error) {
    const state = normalizeState(defaultState());
    await writeState(state);
    return state;
  }
}

async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(state, null, 2));
}

async function ensureAdminUser() {
  const state = await readState();
  const email = (process.env.ADMIN_EMAIL || "zuppiosnacks176@gmail.com").trim().toLowerCase();
  if (!state.users.some((user) => user.email === email)) {
    const password = process.env.ADMIN_PASSWORD || "ChangeMe@12345";
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
    await writeState(state);
  }
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function mutate(mutator) {
  const state = await readState();
  const result = await mutator(state);
  await writeState(state);
  return result;
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
