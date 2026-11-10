import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

const hardcodedProducts = [
  { _id: '1', name: 'Charcoal Wool Blazer', price: 23987, category: 'Blazers', image: product1 },
  { _id: '2', name: 'Navy Slim Trousers', price: 3607, category: 'Trousers', image: product2 },
  { _id: '3', name: 'Premium White Shirt', price: 2077, category: 'Shirts', image: product3 },
  { _id: '4', name: 'Leather Oxford Shoes', price: 2667, category: 'Footwear', image: product4 },
  { _id: '5', name: 'Black Turtleneck', price: 8217, category: 'Knitwear', image: product5 },
  { _id: '6', name: 'Olive Bomber Jacket', price: 8177, category: 'Outerwear', image: product6 },
];

const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
const CACHE_KEY = "velaro_catalog_cache";

const formatProduct = (p) => ({
  ...p,
  image: p.image && p.image.startsWith('/uploads') ? API_URL + p.image : p.image
});

const ShopSection = ({ onOrderOpen }) => {
  const [hoveredId, setHoveredId] = useState(null);
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

  const loadProducts = () => {
    fetch(API_URL + '/api/products')
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
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadProducts();

    const socket = io(API_URL);

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

  return (
    <section id="shop" className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-accent uppercase tracking-widest text-xs font-bold mb-4 block">The Collection</span>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Curated Essentials</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Discover our latest arrivals designed for the modern gentleman who appreciates timeless style and uncompromising quality.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {products.slice(0, 6).map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(product._id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onOrderOpen(product)}
            >
              <div className="relative overflow-hidden aspect-[4/5] bg-secondary mb-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${hoveredId === product._id ? 'scale-105' : 'scale-100'}`}
                  loading="lazy"
                />
                
                <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 flex items-center justify-center ${hoveredId === product._id ? 'opacity-100' : 'opacity-0'}`}>
                  <button className="bg-white text-black px-6 py-3 uppercase tracking-wider text-sm font-semibold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <ShoppingBag size={16} /> Quick Shop
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
                  <h3 className="font-display text-lg">{product.name}</h3>
                </div>
                <p className="font-medium">₹{Number(product.price).toLocaleString('en-IN')}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View More button: takes user to full e-commerce purchase site */}
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">
            {products.length > 6 
              ? `Showing 6 of ${products.length} Curated Essentials` 
              : `Explore all ${products.length} bespoke garments in our store`}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-accent bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground font-body text-xs uppercase tracking-[0.2em] font-bold shadow-elevated transition-all duration-300 hover:scale-105 group"
          >
            <span>{products.length > 6 ? `View More (${products.length} Items)` : "View More in Store"}</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopSection;
