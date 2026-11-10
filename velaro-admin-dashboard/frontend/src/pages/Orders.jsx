import { useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Calendar, IndianRupee, Mail, RefreshCw, CreditCard, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

// Map product names to local images
const productImages = {
  "Charcoal Wool Blazer": product1,
  "Navy Slim Trousers": product2,
  "Premium White Shirt": product3,
  "Leather Oxford Shoes": product4,
  "Black Turtleneck": product5,
  "Olive Bomber Jacket": product6,
};

// Group flat order docs by their orderId into grouped order cards
const groupOrders = (orders) => {
  const groups = {};
  orders.forEach((item) => {
    const key = item.orderId || item._id || "legacy";
    if (!groups[key]) {
      groups[key] = {
        id: key,
        date: item.createdAt || new Date().toISOString(),
        status: item.status || "Processing",
        paymentMethod: item.paymentMethod || "Online Payment",
        address: item.address,
        phone: item.phone,
        customerEmail: item.customerEmail,
        items: [],
      };
    }
    groups[key].items.push(item);
  });
  return Object.values(groups).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
};

const Orders = () => {
  const { orders, loadingOrders, fetchOrders } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [user?._id, user?.email, fetchOrders]);

  const activeEmail = user?.email || (orders[0]?.customerEmail) || "Active Account";
  const groupedOrders = groupOrders(orders);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-32 lg:pt-40 flex-grow max-w-5xl">
        {/* Header with Account Session Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.2em] text-accent mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent" />
              Authenticated Atelier Session
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">Order History</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-card border border-border/80 shadow-sm rounded-lg">
              <Mail size={15} className="text-accent shrink-0" />
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Account Session</span>
                <span className="font-body text-sm font-medium text-foreground">{activeEmail}</span>
              </div>
            </div>
            <button
              onClick={() => fetchOrders()}
              disabled={loadingOrders}
              title="Refresh order history"
              className="p-2.5 border border-border bg-card hover:border-accent text-muted-foreground hover:text-accent transition-colors rounded-lg disabled:opacity-50"
            >
              <RefreshCw size={16} className={loadingOrders ? "animate-spin text-accent" : ""} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingOrders && orders.length === 0 ? (
          <div className="py-24 text-center">
            <RefreshCw size={36} className="mx-auto text-accent animate-spin mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">Retrieving Your Orders</h3>
            <p className="text-sm text-muted-foreground">Synchronizing order history for {activeEmail}…</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State for this specific account */
          <div className="py-20 text-center bg-card border border-border p-12 rounded-xl">
            <Package size={56} className="mx-auto text-muted-foreground/60 mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">No Orders Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-2 text-sm">
              There are currently no orders associated with <span className="text-foreground font-medium">{activeEmail}</span>.
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-md mx-auto mb-8">
              When you purchase bespoke garments under this email account, your complete order history and tracking will be archived here.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 gold-gradient text-accent-foreground px-8 py-3.5 font-body text-sm uppercase tracking-wider hover:opacity-90 transition-opacity font-semibold rounded-md shadow-sm"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          /* Grouped Orders List */
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider px-1">
              <span>{groupedOrders.length} {groupedOrders.length === 1 ? "Checkout Session" : "Checkout Sessions"}</span>
              <span>Account: {activeEmail}</span>
            </div>

            {groupedOrders.map((order) => {
              const orderTotal = order.items.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0
              );

              const statusColor = 
                order.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                order.status === "Shipped" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                order.status === "Refunded" ? "bg-rose-500/10 text-rose-600 border-rose-500/30" :
                "bg-amber-500/10 text-amber-600 border-amber-500/30";

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border p-6 rounded-xl shadow-sm transition-all hover:border-accent/40"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-body text-sm font-semibold text-foreground">
                            Order #{String(order.id).slice(-8)}
                          </span>
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {new Date(order.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-muted-foreground/80">
                            <Mail size={12} />
                            {order.customerEmail || activeEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">Total Amount</span>
                      <p className="font-display text-xl text-foreground flex items-center sm:justify-end gap-0.5 font-bold">
                        <IndianRupee size={16} />
                        {orderTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Order Metadata & Shipping Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-3.5 bg-muted/20 border border-border/70 rounded-lg text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CreditCard size={13} className="text-accent shrink-0" />
                        <span className="font-medium text-foreground">Payment:</span> {order.paymentMethod}
                      </div>
                      {order.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone size={13} className="text-accent shrink-0" />
                          <span className="font-medium text-foreground">Phone:</span> {order.phone}
                        </div>
                      )}
                    </div>
                    {order.address && (
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin size={13} className="text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Delivery Destination:</span>
                          <p className="text-muted-foreground mt-0.5">{order.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchased Garments */}
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Garments in this consignment ({order.items.length})
                    </p>
                    {order.items.map((item, index) => {
                      const name = item.productName || item.name || "";
                      const image = productImages[name] || item.image;
                      const price = Number(item.price) || 0;
                      const qty = Number(item.quantity) || 1;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 py-2.5 border-t border-border/60 first:border-t-0"
                        >
                          <div className="w-14 h-14 bg-muted border border-border/80 rounded-md overflow-hidden flex-shrink-0">
                            {image ? (
                              <img src={image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={18} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {item.category && (
                              <p className="font-body text-[10.5px] text-muted-foreground uppercase tracking-wider">
                                {item.category}
                              </p>
                            )}
                            <h4 className="font-display text-sm font-semibold text-foreground truncate">{name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.size ? `Size: ${item.size} · ` : ""}Qty: {qty} × ₹{price.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className="font-body text-base font-semibold text-accent">
                            ₹{(price * qty).toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
