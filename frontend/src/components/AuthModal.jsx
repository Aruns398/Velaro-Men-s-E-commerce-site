import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "signin") {
      toast.success("Welcome back to Velaro!");
    } else {
      toast.success("Account created successfully!");
    }
    setForm({ name: "", email: "", password: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-card w-full max-w-md p-8 shadow-elevated relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="font-display text-2xl text-foreground mb-2">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {mode === "signin" ? "Sign in to your Velaro account" : "Join the Velaro experience"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Full Name</label>
                  <input
                    name="name" value={form.name} onChange={handleChange} required
                    className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              )}
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Email</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  placeholder="john@email.com"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Password</label>
                <input
                  name="password" type="password" value={form.password} onChange={handleChange} required
                  className="w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-3 hover:opacity-90 transition-opacity duration-300"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center mt-6 font-body text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "signin" ? "register" : "signin")}
                className="text-accent hover:underline"
              >
                {mode === "signin" ? "Register" : "Sign In"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
