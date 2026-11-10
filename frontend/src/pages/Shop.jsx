import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  ChevronRight, 
  Sparkles,
  Plus
} from "lucide-react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderDrawer from "../components/OrderDrawer";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import { API_ORIGIN, API_URL } from "@/lib/api";

const hardcodedProducts = [
  { _id: '1', name: 'Charcoal Wool Blazer', price: 23987, category: 'Blazers', image: product1 },
  { _id: '2', name: 'Navy Slim Trousers', price: 3607, category: 'Trousers', image: product2 },
  { _id: '3', name: 'Premium White Shirt', price: 2077, category: 'Shirts', image: product3 },
  { _id: '4', name: 'Leather Oxford Shoes', price: 2667, category: 'Footwear', image: product4 },
  { _id: '5', name: 'Black Turtleneck', price: 8217, category: 'Knitwear', image: product5 },
  { _id: '6', name: 'Olive Bomber Jacket', price: 8177, category: 'Outerwear', image: product6 },
];

const CACHE_KEY = "velaro_catalog_cache";

const formatProduct = (p) => ({
  ...p,
  image: p?.image && typeof p.image === 'string' && p.image.startsWith('/uploads') 
    ? API_ORIGIN + p.image 
    : (p?.image || product1)
});

const Shop = () => {
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(formatProduct);
        }
      }
    } catch {}
    return hardcodedProducts;
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [priceRange, setPriceRange] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const loadProducts = () => {
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(formatProduct);
          setProducts(formatted);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {}
        }
      })
      .catch(err => console.error("Failed to load products:", err));
  };

  useEffect(() => {
    loadProducts();

    const socket = io(API_ORIGIN);

    socket.on("product_created", (newProduct) => {
      const formatted = formatProduct(newProduct);
      setProducts(prev => {
        const filtered = prev.filter(p => p._id !== formatted._id);
        const updated = [formatted, ...filtered];
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    });

    socket.on("product_deleted", ({ id }) => {
      setProducts(prev => {
        const updated = prev.filter(p => p._id !== id);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    });

    socket.on("products_updated", () => {
      loadProducts();
    });

    let bc;
    try {
      bc = new BroadcastChannel("velaro_products");
      bc.onmessage = (event) => {
        if (event.data?.type === "REFRESH") {
          loadProducts();
        }
      };
    } catch {}

    return () => {
      socket.disconnect();
      if (bc) bc.close();
    };
  }, []);

  // Compute dynamic category list with counts
  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const cat = p.category?.trim() || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return [
      { id: "ALL", label: "All Items", count: products.length },
      ...Object.keys(counts).map((cat) => ({
        id: cat,
        label: cat,
        count: counts[cat]
      }))
    ];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Price range filter
    if (priceRange === "UNDER_5000") {
      result = result.filter((p) => Number(p.price) < 5000);
    } else if (priceRange === "5000_15000") {
      result = result.filter((p) => Number(p.price) >= 5000 && Number(p.price) <= 15000);
    } else if (priceRange === "ABOVE_15000") {
      result = result.filter((p) => Number(p.price) > 15000);
    }

    // Sort
    if (sortBy === "PRICE_LOW_HIGH") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "PRICE_HIGH_LOW") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "NAME_AZ") {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default: newest or original catalog sequence
      result.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }

    return result;
  }, [products, search, selectedCategory, priceRange, sortBy]);

  const handleQuickShop = (product) => {
    setSelectedProduct(product);
    setOrderOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setPriceRange("ALL");
    setSortBy("NEWEST");
  };

  const hasActiveFilters = search || selectedCategory !== "ALL" || priceRange !== "ALL" || sortBy !== "NEWEST";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Hero Banner Header */}
        <section className="bg-primary border-b border-secondary/60 py-12 md:py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/60 mb-4 font-body">
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-accent">E-Commerce Store</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-accent uppercase tracking-[0.25em] text-xs font-bold block mb-2">
                  VELARO ATELIER · ONLINE STORE
                </span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white">
                  The Full Collection
                </h1>
                <p className="text-primary-foreground/75 text-sm md:text-base max-w-xl mt-3 font-body">
                  Explore our entire bespoke catalog. Handcrafted tailored blazers, trousers, crisp shirting, and luxury footwear designed for the modern gentleman.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* E-Commerce Filter Bar & Controls */}
        <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border py-4 shadow-sm">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by suit, blazer, fabric, name…"
                  className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Price & Sort Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Price Range Filter */}
                <div className="flex items-center gap-1.5 bg-secondary/30 border border-border rounded-xl px-3 py-2 text-xs">
                  <SlidersHorizontal size={14} className="text-accent" />
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Price:</span>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="ALL">All Prices</option>
                    <option value="UNDER_5000">Under ₹5,000</option>
                    <option value="5000_15000">₹5,000 – ₹15,000</option>
                    <option value="ABOVE_15000">Above ₹15,000</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center gap-1.5 bg-secondary/30 border border-border rounded-xl px-3 py-2 text-xs">
                  <ArrowUpDown size={14} className="text-accent" />
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="NEWEST">Newest Arrivals</option>
                    <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                    <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                    <option value="NAME_AZ">Name: A to Z</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-accent hover:underline flex items-center gap-1 px-2 py-1 font-semibold"
                  >
                    <X size={13} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-body uppercase tracking-wider font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-black/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Results Counter & Product Catalog Grid */}
        <section className="container mx-auto px-4 lg:px-8 mt-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> of {products.length} garments
            </p>
            <div className="flex items-center gap-1 text-xs text-accent font-semibold">
              <Sparkles size={13} />
              <span>Free Bespoke Consultation on All Orders</span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-secondary/10 p-8">
              <ShoppingBag size={48} className="mx-auto text-muted-foreground/60 mb-4" />
              <h3 className="font-display text-2xl text-foreground mb-2">No items match your criteria</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Try loosening your filters, selecting a different category, or searching for other tailoring essentials.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full gold-gradient text-accent-foreground font-body text-xs uppercase tracking-wider font-semibold shadow-elevated"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4) }}
                  className="group bg-card border border-border hover:border-accent/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-elevated transition-all duration-300 flex flex-col cursor-pointer"
                  onMouseEnter={() => setHoveredId(product._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleQuickShop(product)}
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        hoveredId === product._id ? "scale-105" : "scale-100"
                      }`}
                      loading="lazy"
                    />

                    {/* Category Tag */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-body uppercase tracking-wider text-white/90 border border-white/10 font-medium">
                        {product.category}
                      </span>
                    </div>

                    {/* Stock / Bespoke Tag */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-accent/90 text-accent-foreground text-[9px] font-bold uppercase tracking-widest shadow-sm">
                        In Stock
                      </span>
                    </div>

                    {/* Hover Quick Shop Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center p-4 ${
                        hoveredId === product._id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickShop(product);
                        }}
                        className="w-full bg-white text-black py-3 px-4 rounded-xl font-body text-xs uppercase tracking-wider font-bold shadow-elevated flex items-center justify-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 hover:bg-accent hover:text-accent-foreground"
                      >
                        <ShoppingBag size={15} /> Quick Shop
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-base text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-body">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Price</span>
                        <p className="font-display text-lg text-accent font-bold">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickShop(product);
                        }}
                        className="w-9 h-9 rounded-full border border-secondary bg-secondary/50 hover:bg-accent hover:text-accent-foreground hover:border-accent text-foreground flex items-center justify-center transition-all shadow-sm"
                        title="Add to cart"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Quick Shop Drawer Modal */}
      <OrderDrawer
        isOpen={orderOpen}
        onClose={() => {
          setOrderOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default Shop;
