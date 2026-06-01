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
  { label: "Product Categories", href: "/product-categories" },
  { label: "How To Buy", href: "/how-to-buy" },
  { label: "About", href: "/about" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" }
];

const productCategories = [
  {
    id: "potato-chips",
    name: "Potato Chips",
    image: "/images/categories/potato-chips.svg",
    summary: "Aloo Snack packs with crisp potato crunch and bold ZUPPIO flavors.",
    status: "Available",
    featured: true,
    groups: [
      {
        name: "Aloo Snack",
        products: [
          { name: "Seedha Simple", status: "Available", image: "/images/yellow.png" },
          { name: "Mast Masaledar", status: "Available", image: "/images/purple.png" },
          { name: "Italian Tadka", status: "Available", image: "/images/green.png" }
        ]
      }
    ]
  },
  {
    id: "beverages",
    name: "Beverages",
    image: "/images/categories/beverages.svg",
    summary: "Refreshing drinks planned for everyday moments and high-energy occasions.",
    status: "Coming Soon",
    groups: [
      {
        name: "Coming Soon",
        products: [
          { name: "Zeera Drinks", status: "Coming Soon" },
          { name: "Energy Drinks", status: "Coming Soon" },
          { name: "Tighter Drinks", status: "Coming Soon" },
          { name: "Water", status: "Coming Soon" },
          { name: "Aam Panna", status: "Coming Soon" }
        ]
      }
    ]
  },
  {
    id: "biscuit",
    name: "Biscuit",
    image: "/images/categories/biscuit.svg",
    summary: "Baked, cream, cookie, and wafer biscuit formats for future snack shelves.",
    status: "Coming Soon",
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
    name: "Banana Chips",
    image: "/images/categories/banana-chips.svg",
    summary: "Crunchy banana chips with classic salted and aloo-inspired ideas.",
    status: "Coming Soon",
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
    name: "Wafers",
    image: "/images/categories/wafers.svg",
    summary: "Light wafer snacks with the familiar ZUPPIO flavor personality.",
    status: "Coming Soon",
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
    name: "Ready-to-Eat",
    image: "/images/categories/ready-to-eat.svg",
    summary: "Convenient meal and beverage formats for fast, everyday consumption.",
    status: "Coming Soon",
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

module.exports = {
  flavors,
  pages,
  productCategories
};
