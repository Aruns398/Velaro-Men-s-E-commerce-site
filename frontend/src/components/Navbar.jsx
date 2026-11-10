import { useState } from "react";
import { Menu, X, User, UserPlus, ShoppingCart, ShoppingBag, Package, LogOut, Home, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const Navbar = ({ onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const { user, isAuthenticated, signout } = useAuth();

  const isHomePage = location.pathname === "/";

  const links = [
    { label: "Shop", path: "/shop" },
    { label: "Collection", section: "shop" },
    { label: "Bespoke", section: "bespoke" },
    { label: "Appointments", section: "appointments" },
    { label: "Contact", section: "contact" },
  ];

  const pageLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "Shop", path: "/shop", icon: ShoppingBag },
    { label: "Cart", path: "/cart", icon: ShoppingCart },
    { label: "Orders", path: "/orders", icon: Package },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-secondary">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/velaro-logo.jpg"
            alt="Velaro Emblem"
            className="w-9 h-9 rounded-full object-cover border border-[#d4af37]/50 shadow-sm group-hover:border-[#d4af37] transition-all duration-300"
          />
          <span className="font-display text-2xl tracking-[0.2em] text-primary-foreground group-hover:text-accent transition-colors duration-300">
            VELARO
          </span>
        </Link>

        {isHomePage ? (
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) =>
              l.path ? (
                <Link
                  key={l.label}
                  to={l.path}
                  className="font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors duration-300 uppercase"
                >
                  {l.label}
                </Link>
              ) : (
                <button
                  key={l.section}
                  onClick={() => onNavigate && onNavigate(l.section)}
                  className="font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors duration-300 uppercase"
                >
                  {l.label}
                </button>
              )
            )}
            <Link
              to="/cart"
              className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors duration-300 uppercase"
            >
              <ShoppingCart size={18} />
              Cart
              {getCartItemCount() > 0 && (
                <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                  {getCartItemCount()}
                </span>
              )}
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-8">
            {pageLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors duration-300 uppercase"
              >
                {l.icon && <l.icon size={18} />}
                {l.label}
                {l.path === "/cart" && getCartItemCount() > 0 && (
                  <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 text-primary-foreground hover:text-accent transition-colors duration-300"
                  aria-label="Account menu"
                >
                  <div className="w-9 h-9 border border-secondary bg-secondary/40 flex items-center justify-center transition-transform hover:scale-105">
                    <User size={16} className="text-primary-foreground/80 hover:text-accent" />
                  </div>
                  <div className="flex items-center gap-1.5 hidden lg:flex">
                    <span className="font-body text-sm uppercase tracking-wider">{user?.name || "Account"}</span>
                    {user?.isGuest && (
                      <span className="text-[10px] bg-accent/20 text-accent border border-accent/40 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Guest
                      </span>
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-4 w-52 bg-popover/95 backdrop-blur-xl border border-border shadow-elevated flex flex-col z-50 overflow-hidden"
                    >
                      {user?.isGuest && (
                        <div className="px-5 py-2.5 bg-accent/10 border-b border-border text-[11px] font-body tracking-wider uppercase text-accent font-semibold flex items-center justify-between">
                          <span>Browsing as Guest</span>
                        </div>
                      )}
                      {user?.role === "admin" && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 font-body text-sm uppercase tracking-widest text-[#d4af37] hover:bg-muted/30 transition-all duration-300 text-left group font-semibold"
                        >
                          <ShieldCheck size={16} className="text-[#d4af37]" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 font-body text-sm uppercase tracking-widest text-popover-foreground hover:text-accent hover:bg-muted/30 transition-all duration-300 text-left group"
                      >
                        <Package size={16} className="text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                        Orders
                      </Link>
                      {user?.isGuest && (
                        <Link
                          to="/login"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 font-body text-sm uppercase tracking-widest text-popover-foreground hover:text-accent hover:bg-muted/30 transition-all duration-300 text-left group"
                        >
                          <User size={16} className="text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                          Sign In
                        </Link>
                      )}
                      <div className="border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            signout();
                            setProfileOpen(false);
                            navigate("/login", { replace: true, state: null });
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3 font-body text-sm uppercase tracking-widest text-popover-foreground hover:text-destructive hover:bg-muted/30 transition-all duration-300 text-left group"
                        >
                          <LogOut size={16} className="text-muted-foreground group-hover:text-destructive transition-colors duration-300" />
                          {user?.isGuest ? "Exit Guest Mode" : "Sign out"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user?.isGuest && (
                <Link
                  to="/login"
                  className="hidden lg:flex items-center gap-1.5 text-accent hover:text-accent/80 font-body text-xs uppercase tracking-wider font-semibold transition-colors duration-300 border border-accent/30 hover:border-accent/60 px-2.5 py-1 rounded"
                >
                  Sign In
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-primary-foreground/75 hover:text-accent transition-colors duration-300"
              >
                <User size={16} />
                <span className="font-body text-xs uppercase tracking-wider">Sign In</span>
              </Link>
              <span className="text-primary-foreground/30 text-xs">|</span>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors duration-300"
              >
                <UserPlus size={16} />
                <span className="font-body text-xs uppercase tracking-wider font-semibold">Create Account</span>
              </Link>
            </div>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-primary-foreground">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-primary border-t border-secondary overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {isHomePage ? (
                <>
                  {links.map((l) =>
                    l.path ? (
                      <Link
                        key={l.label}
                        to={l.path}
                        onClick={() => setMobileOpen(false)}
                        className="font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors uppercase text-left"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <button
                        key={l.section}
                        onClick={() => { onNavigate && onNavigate(l.section); setMobileOpen(false); }}
                        className="font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors uppercase text-left"
                      >
                        {l.label}
                      </button>
                    )
                  )}
                  <Link
                    to="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors uppercase"
                  >
                    <ShoppingCart size={18} />
                    Cart
                    {getCartItemCount() > 0 && (
                      <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                        {getCartItemCount()}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                pageLinks.map((l) => (
                  <Link
                    key={l.path}
                    to={l.path}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors uppercase"
                  >
                    {l.icon && <l.icon size={18} />}
                    {l.label}
                    {l.path === "/cart" && getCartItemCount() > 0 && (
                      <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                        {getCartItemCount()}
                      </span>
                    )}
                  </Link>
                ))
              )}
              {isAuthenticated ? (
                <div className="mt-4 pt-4 border-t border-secondary">
                  {user?.isGuest && (
                    <div className="mb-3 px-2 py-1 text-xs text-accent tracking-wider uppercase font-semibold">
                      Browsing as Guest
                    </div>
                  )}
                  <div className="flex flex-col gap-4 mb-4 border-b border-secondary pb-4">
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 font-body text-sm tracking-wider text-[#d4af37] uppercase font-semibold"
                      >
                        <ShieldCheck size={18} />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent transition-colors uppercase"
                    >
                      <Package size={18} />
                      Orders
                    </Link>

                    {user?.isGuest && (
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 font-body text-sm tracking-wider text-accent uppercase font-medium"
                      >
                        <User size={18} />
                        Sign In
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      signout();
                      setMobileOpen(false);
                      navigate("/login", { replace: true, state: null });
                    }}
                    className="flex items-center gap-2 font-body text-sm tracking-wider text-destructive uppercase text-left w-full hover:opacity-80 transition-opacity"
                  >
                    <LogOut size={18} />
                    {user?.isGuest ? "Exit Guest Mode" : "Sign out"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-2 pt-2 border-t border-secondary">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 font-body text-sm tracking-wider text-primary-foreground/70 hover:text-accent uppercase text-left"
                  >
                    <User size={18} />
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 font-body text-sm tracking-wider text-accent uppercase text-left font-medium"
                  >
                    <UserPlus size={18} />
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
