import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Truck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, placeOrder, clearCart } = useCart();
  const { user } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    address: "",
    phone: "",
    email: user?.email || ""
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");

  useEffect(() => {
    if (user?.email && !shippingDetails.email) {
      setShippingDetails(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const [showCardForm, setShowCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    setShowShippingModal(true);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shippingDetails.address || !shippingDetails.phone || !shippingDetails.email) {
      toast.error("Please fill in your shipping details including your email address");
      return;
    }
    setShowShippingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = (method) => {
    if (method === "Online Payment") {
      setShowPaymentModal(false);
      setShowCardForm(true);
    } else {
      processOrder(method);
    }
  };

  const processOrder = async (method) => {
    setSelectedPayment(method);
    setShowPaymentModal(false);
    setShowCardForm(false);
    setIsPlacingOrder(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    await placeOrder(method, shippingDetails);
    toast.success(`Order placed successfully with ${method}!`);
    setIsPlacingOrder(false);
    setSelectedPayment("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
    setShippingDetails({ address: "", phone: "", email: user?.email || "" });
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
      toast.error("Please fill in all card details");
      return;
    }
    processOrder("Online Payment");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-20 pt-32 lg:pt-40 flex-grow flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to get started</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 gold-gradient text-accent-foreground px-6 py-3 font-body text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-32 lg:pt-40 flex-grow">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
          <h1 className="font-display text-3xl text-foreground">Shopping Cart</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <motion.div
                key={`${item.id}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border p-6 flex gap-4"
              >
                <div className="w-24 h-24 bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-body text-xs tracking-wider text-muted-foreground uppercase">{item.category}</p>
                      <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="w-8 h-8 border border-border flex items-center justify-center text-sm hover:border-accent transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="w-8 h-8 border border-border flex items-center justify-center text-sm hover:border-accent transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-body text-lg text-accent font-bold">₹{item.price}</span>
                    </div>
                    <span className="font-display text-xl text-foreground">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-6 sticky top-4">
              <h2 className="font-display text-xl text-foreground mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-body text-lg">₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-body text-lg">Free</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-body text-lg text-foreground">Total</span>
                  <span className="font-display text-2xl text-foreground">₹{getCartTotal()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPlacingOrder ? `Processing ${selectedPayment}...` : "Proceed to Payment"}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full border border-border text-foreground font-body text-sm uppercase tracking-wider py-3 hover:bg-muted transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Shipping Modal */}
      <AnimatePresence>
        {showShippingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm"
              onClick={() => setShowShippingModal(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-card border border-border shadow-elevated hide-scrollbar pointer-events-auto rounded-xl"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl text-foreground">Shipping Details</h3>
                    <button
                      onClick={() => setShowShippingModal(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Delivery Address</label>
                      <textarea
                        placeholder="Enter your full address"
                        value={shippingDetails.address}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                        className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors min-h-[100px] resize-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={shippingDetails.phone}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                        className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Email Address (Order Confirmation Receipt)</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={shippingDetails.email}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                        className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-4 mt-6 hover:opacity-90 transition-opacity duration-300"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm"
              onClick={() => setShowPaymentModal(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-card border border-border shadow-elevated hide-scrollbar pointer-events-auto rounded-xl"
              >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl text-foreground">Select Payment Method</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => handlePaymentMethodSelect("Online Payment")}
                    className="w-full flex items-center gap-4 p-4 border border-border hover:border-accent transition-colors group"
                  >
                    <div className="w-12 h-12 bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <CreditCard size={24} className="text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-body text-sm font-medium text-foreground">Online Payment</p>
                      <p className="text-xs text-muted-foreground">Credit/Debit Card, UPI, Net Banking</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodSelect("Cash on Delivery")}
                    className="w-full flex items-center gap-4 p-4 border border-border hover:border-accent transition-colors group"
                  >
                    <div className="w-12 h-12 bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Truck size={24} className="text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-body text-sm font-medium text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                    </div>
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-display text-lg text-foreground">₹{getCartTotal()}</span>
                  </div>
                </div>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Card Payment Modal */}
      <AnimatePresence>
        {showCardForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm"
              onClick={() => setShowCardForm(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-card border border-border shadow-elevated hide-scrollbar pointer-events-auto rounded-xl"
              >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl text-foreground">Enter Card Details</h3>
                  <button
                    onClick={() => setShowCardForm(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-4 mt-6 hover:opacity-90 transition-opacity duration-300"
                  >
                    Pay ₹{getCartTotal()}
                  </button>
                </form>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;