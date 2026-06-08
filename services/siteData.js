const flavors = [
  {
    id: "seedha",
    name: "Seedha Simple",
    theme: "Simple & Relaxed",
    color: "yellow",
    side: "left",
    spice: 20,
    image: "yellow",
    description: "Classic salted potato chips made for movie nights, tea breaks, and everyday snacking."
  },
  {
    id: "masaledar",
    name: "Mast Masaledar",
    theme: "Gaming & Party",
    color: "purple",
    side: "center",
    spice: 92,
    image: "purple",
    description: "Bold Indian masala flavor with spicy, tangy, chatpata energy."
  },
  {
    id: "italian",
    name: "Italian Tadka",
    theme: "Travel & Cafe Vibes",
    color: "green",
    side: "right",
    spice: 48,
    image: "green",
    description: "Italian herbs and creamy seasoning mixed with an Indian-style twist."
  }
];

const pages = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/product-categories" },
  { label: "Where To Buy", href: "/how-to-buy" },
  { label: "Blogs", href: "/blogs" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Term", href: "/terms" }
];

const productCategories = [
  {
    id: "potato-chips",
    slug: "potato-chips",
    name: "Potato Chips",
    title: "Potato Chips",
    image: "/images/categories/potato-chips.svg",
    banner: "/images/categories/potato-chips.svg",
    summary: "Aloo Snack packs with crisp potato crunch and bold ZUPPIO flavors.",
    description: "Crisp aloo snack packs made for everyday munching, tea breaks, and party bowls with bold ZUPPIO flavor energy.",
    status: "Available",
    featured: true,
    products: [
      { name: "Seedha Simple", status: "Available", image: "/images/yellow.png", description: "Classic salted potato chips with a clean, simple crunch." },
      { name: "Italian Tadka", status: "Available", image: "/images/green.png", description: "Italian herbs and creamy seasoning with an Indian-style twist." },
      { name: "Mast Masaledar", status: "Available", image: "/images/purple.png", description: "Bold Indian masala chips with spicy, tangy, chatpata energy." }
    ],
    groups: [
      {
        name: "Aloo Snack",
        products: [
          { name: "Seedha Simple", status: "Available", image: "/images/yellow.png" },
          { name: "Italian Tadka", status: "Available", image: "/images/green.png" },
          { name: "Mast Masaledar", status: "Available", image: "/images/purple.png" }
        ]
      }
    ]
  },
  {
    id: "beverages",
    slug: "beverages",
    name: "Beverages",
    title: "Beverages",
    image: "/images/categories/beverages.svg",
    banner: "/images/categories/beverages.svg",
    summary: "Refreshing drinks planned for everyday moments and high-energy occasions.",
    description: "Refreshing beverage ideas are being shaped for everyday hydration, energy moments, and flavorful Indian refreshment.",
    status: "Coming Soon",
    products: [],
    groups: [
      {
        name: "Coming Soon",
        products: [
          { name: "Zeera Drinks", status: "Coming Soon" },
          { name: "Energy Drinks", status: "Coming Soon" },
          { name: "Tighter Drinks", status: "Coming Soon" },
          { name: "Water", status: "Coming Soon" },
          { name: "Aam Papad", status: "Coming Soon" }
        ]
      }
    ]
  },
  {
    id: "biscuit",
    slug: "biscuit",
    name: "Biscuit",
    title: "Biscuit",
    image: "/images/categories/biscuit.svg",
    banner: "/images/categories/biscuit.svg",
    summary: "Baked, cream, cookie, and wafer biscuit formats for future snack shelves.",
    description: "A future biscuit range covering baked, cream, cookie, and wafer formats for simple, reliable snack shelves.",
    status: "Coming Soon",
    products: [],
    groups: [
      {
        name: "Biscuit Range",
        products: [
          { name: "Baked Biscuit", status: "Coming Soon" },
          { name: "Cream Biscuit", status: "Coming Soon" },
          { name: "Cookies", status: "Coming Soon" },
          { name: "Wafer Biscuits", status: "Coming Soon" }
        ]
      }
    ]
  },
  {
    id: "banana-chips",
    slug: "banana-chips",
    name: "Banana Chips",
    title: "Banana Chips",
    image: "/images/categories/banana-chips.svg",
    banner: "/images/categories/banana-chips.svg",
    summary: "Crunchy banana chips with classic salted and aloo-inspired ideas.",
    description: "Crispy banana chips are planned for classic salted crunch and ZUPPIO-style flavor twists.",
    status: "Coming Soon",
    products: [],
    groups: [
      {
        name: "Coming Soon",
        products: [
          { name: "Salted Banana Chips", status: "Coming Soon" },
          { name: "Aloo Banana Chips", status: "Coming Soon" }
        ]
      }
    ]
  },
  {
    id: "wafers",
    slug: "wafers",
    name: "Wafers",
    title: "Wafers",
    image: "/images/categories/wafers.svg",
    banner: "/images/categories/wafers.svg",
    summary: "Light wafer snacks with the familiar ZUPPIO flavor personality.",
    description: "Light, crisp wafer snacks are planned with familiar ZUPPIO flavor energy and easy shareability.",
    status: "Coming Soon",
    products: [],
    groups: [
      {
        name: "Wafer Flavors",
        products: [
          { name: "Seedha Simple Wafers", status: "Coming Soon" },
          { name: "Mast Masaledar Wafers", status: "Coming Soon" },
          { name: "Italian Tadka Wafers", status: "Coming Soon" }
        ]
      }
    ]
  },
  {
    id: "ready-to-eat",
    slug: "ready-to-eat",
    name: "Ready-To-Eat",
    title: "Ready-To-Eat",
    image: "/images/categories/ready-to-eat.svg",
    banner: "/images/categories/ready-to-eat.svg",
    summary: "Convenient meal and beverage formats for fast, everyday consumption.",
    description: "Convenient ready-to-eat food ideas are being prepared for quick meals, travel, and busy everyday routines.",
    status: "Coming Soon",
    products: [],
    groups: [
      {
        name: "Meal Range",
        products: [
          { name: "Poha", status: "Coming Soon" },
          { name: "Rajma Chawal", status: "Coming Soon" },
          { name: "Noodles", status: "Coming Soon" },
          { name: "Creamy Chai Coffee", status: "Coming Soon" }
        ]
      }
    ]
  }
];

function slugifyCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productsFromGroups(category) {
  return (category.groups || [])
    .flatMap((group) => group.products || [])
    .filter((product) => String(product.status || "").toLowerCase() === "available");
}

function normalizeProductCategory(category = {}, fallback = {}) {
  const slug = category.slug || fallback.slug || category.id || fallback.id || slugifyCategory(category.title || category.name || fallback.title || fallback.name);
  const title = category.title || category.name || fallback.title || fallback.name || "Product Category";
  const status = category.status || fallback.status || "Coming Soon";
  const groups = Array.isArray(category.groups) ? category.groups : fallback.groups || [];
  const products = Array.isArray(category.products)
    ? category.products
    : Array.isArray(fallback.products)
      ? fallback.products
      : String(status).toLowerCase().includes("coming")
        ? []
        : productsFromGroups({ groups });

  return {
    ...fallback,
    ...category,
    id: category.id || fallback.id || slug,
    slug,
    name: category.name || category.title || fallback.name || title,
    title,
    image: category.image || fallback.image || category.banner || fallback.banner || "",
    banner: category.banner || fallback.banner || category.image || fallback.image || "",
    summary: category.summary || fallback.summary || category.description || fallback.description || "",
    description: category.description || fallback.description || category.summary || fallback.summary || "",
    status,
    groups,
    products
  };
}

function normalizeProductCategories(categories = productCategories) {
  const defaultsByKey = new Map();
  productCategories.forEach((category) => {
    [category.id, category.slug, slugifyCategory(category.name), slugifyCategory(category.title)].filter(Boolean).forEach((key) => {
      defaultsByKey.set(key, category);
    });
  });

  return (Array.isArray(categories) ? categories : productCategories).map((category) => {
    const key = category.slug || category.id || slugifyCategory(category.title || category.name);
    return normalizeProductCategory(category, defaultsByKey.get(key) || {});
  });
}

function findProductCategory(categories, slug) {
  const lookup = slugifyCategory(slug);
  return normalizeProductCategories(categories).find((category) => {
    return category.slug === lookup || category.id === lookup || slugifyCategory(category.title || category.name) === lookup;
  });
}

module.exports = {
  flavors,
  pages,
  productCategories,
  normalizeProductCategories,
  findProductCategory,
  slugifyCategory
};
