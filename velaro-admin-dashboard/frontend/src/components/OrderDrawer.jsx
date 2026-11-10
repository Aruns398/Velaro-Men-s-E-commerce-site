import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../contexts/CartContext";

const FOOTWEAR_SIZES = [
  { uk: "UK 6", eu: "EU 40", us: "US 7" },
  { uk: "UK 7", eu: "EU 41", us: "US 8" },
  { uk: "UK 8", eu: "EU 42", us: "US 9" },
  { uk: "UK 9", eu: "EU 43", us: "US 10" },
  { uk: "UK 10", eu: "EU 44", us: "US 11" },
  { uk: "UK 11", eu: "EU 45", us: "US 12" },
  { uk: "UK 12", eu: "EU 46", us: "US 13" },
];

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];

const isFootwearProduct = (product) => {
  if (!product) return false;
  const category = (product.category || "").toLowerCase();
  const name = (product.name || "").toLowerCase();
  const keywords = [
    "footwear",
    "shoe",
    "shoes",
    "boot",
    "boots",
    "sneaker",
    "sneakers",
    "loafer",
    "loafers",
    "oxford",
    "derby",
    "monk",
    "brogue",
    "chelsea",
    "sandal",
    "sandals",
    "slipper",
    "slippers",
    "mule",
    "mules",
    "foot wear"
  ];
  return keywords.some((kw) => category.includes(kw) || name.includes(kw));
};

const OrderDrawer = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [shoeSystem, setShoeSystem] = useState("UK");
  const { addToCart } = useCart();

  const isFootwear = isFootwearProduct(product);
  const hasCustomSizes = Array.isArray(product?.sizes) && product.sizes.length > 0;

  useEffect(() => {
    if (isOpen) {
      setSize("");
      setQuantity(1);
      setShoeSystem("UK");
    }
  }, [isOpen, product?._id, product?.name]);

  const handleClose = () => {
    setSize("");
    setQuantity(1);
    onClose();
  };

  const handleSystemChange = (newSystem) => {
    setShoeSystem(newSystem);
    if (size) {
      const matched = FOOTWEAR_SIZES.find(
        (s) => s.uk === size || s.eu === size || s.us === size
      );
      if (matched) {
        setSize(matched[newSystem.toLowerCase()]);
      }
    }
  };

  const handleOrder = () => {
    if (!size) {
      toast.error(isFootwear ? "Please select a shoe size" : "Please select a size");
      return;
    }
    addToCart(product, size, quantity);
    toast.success(`${product?.name} (${size}) added to cart!`);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm"
            onClick={handleClose}
          />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="w-full max-w-md max-h-[90vh] bg-card shadow-elevated flex flex-col pointer-events-auto rounded-xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-xl text-foreground">Order Details</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>

              <div>
                <p className="font-body text-xs tracking-wider text-muted-foreground uppercase">{product.category}</p>
                <h3 className="font-display text-2xl text-foreground mt-1">{product.name}</h3>
                <p className="font-body text-lg text-accent font-bold mt-2">₹{product.price}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground block">
                      {isFootwear ? "Shoe Size" : "Size"}
                    </label>
                    {isFootwear && (
                      <div className="inline-flex rounded border border-border p-0.5 bg-muted/40 text-[10px]">
                        {["UK", "EU", "US"].map((system) => (
                          <button
                            key={system}
                            type="button"
                            onClick={() => handleSystemChange(system)}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              shoeSystem === system
                                ? "bg-accent text-accent-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {system}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {size && (
                    <span className="font-body text-xs text-accent font-semibold">
                      Selected: {size}
                    </span>
                  )}
                </div>

                {hasCustomSizes ? (
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`min-w-[48px] h-12 px-3 font-body text-sm border transition-all duration-200 flex items-center justify-center font-medium ${
                          size === s
                            ? "border-accent bg-accent text-accent-foreground font-semibold shadow-sm"
                            : "border-border text-foreground hover:border-accent bg-background"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : isFootwear ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {FOOTWEAR_SIZES.map((item) => {
                        const val = item[shoeSystem.toLowerCase()];
                        const sub = shoeSystem === "UK" ? item.eu : item.uk;
                        const isSelected = size === val;

                        return (
                          <button
                            key={item.uk}
                            type="button"
                            onClick={() => setSize(val)}
                            className={`min-w-[50px] flex-1 sm:flex-initial h-[52px] px-2.5 py-1 border transition-all duration-200 flex flex-col items-center justify-center text-center ${
                              isSelected
                                ? "border-accent bg-accent text-accent-foreground font-semibold shadow-sm"
                                : "border-border text-foreground hover:border-accent bg-background"
                            }`}
                          >
                            <span className="font-body text-xs font-bold leading-tight">{val}</span>
                            <span
                              className={`text-[10px] leading-tight mt-0.5 ${
                                isSelected ? "text-accent-foreground/80 font-normal" : "text-muted-foreground"
                              }`}
                            >
                              {sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="font-body text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/70" />
                      Indian &amp; UK shoe sizing. Fits true to standard dress shoe size.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {APPAREL_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`w-12 h-12 font-body text-sm border transition-all duration-200 flex items-center justify-center font-medium ${
                          size === s
                            ? "border-accent bg-accent text-accent-foreground font-semibold shadow-sm"
                            : "border-border text-foreground hover:border-accent bg-background"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-3 block">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:border-accent transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-body text-lg text-foreground w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:border-accent transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground uppercase tracking-wider">Total</span>
                <span className="font-display text-2xl text-foreground">₹{product.price * quantity}</span>
              </div>
              <button
                onClick={handleOrder}
                className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-4 hover:opacity-90 transition-opacity duration-300"
              >
                Place Order
              </button>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderDrawer;
