import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { UserCheck, LogOut, ArrowRight, Eye, EyeOff } from "lucide-react";
import midnightSilkBg from "../assets/midnight-silk-bg.jpg";

const Signup = () => {
  const { signup, user, isAuthenticated, signout, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const getDestination = (role) => {
    if (role === "admin") {
      return from && from.startsWith("/admin") ? from : "/admin/dashboard";
    }
    if (!from || from.startsWith("/admin") || from === "/login" || from === "/signup") {
      return "/";
    }
    return from;
  };

  const handleContinue = () => {
    const target = getDestination(user?.role);
    navigate(target, { replace: true });
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    toast.success("Welcome! Continuing as guest.");
    const target = getDestination("guest");
    navigate(target, { replace: true });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (form.password.length < 5) {
      toast.error("Password should be at least 5 characters.");
      return;
    }

    try {
      setBusy(true);
      const data = await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success("Account created successfully! Welcome to Velaro.");
      const target = getDestination(data?.role || "customer");
      navigate(target, { replace: true });
    } catch (error) {
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-primary flex items-center justify-center px-6 py-16 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${midnightSilkBg})` }}
    >
      <h1 className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-[11rem] md:text-[14rem] lg:text-[16rem] font-display font-bold tracking-widest text-white/15 leading-none select-none">
        VELARO
      </h1>

      <div className="relative w-full max-w-md rounded-3xl border border-[#d4af37] bg-black/35 backdrop-blur-xl p-8 md:p-10 shadow-elevated">
        {isAuthenticated && user && !user.isGuest && (
          <div className="mb-6 p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck size={16} className="text-[#d4af37] shrink-0" />
              <span className="truncate">
                Signed in as <b className="text-white">{user.name || user.email}</b>
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleContinue}
                className="bg-[#d4af37] hover:bg-[#c39f31] text-black font-semibold px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition-colors shadow-sm"
                title="Continue to store"
              >
                Continue <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={signout}
                className="text-[#d4af37] hover:underline flex items-center gap-1 font-medium py-1"
                title="Sign out of current account"
              >
                <LogOut size={13} /> Switch
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="font-display text-3xl text-white mb-2">Create Account</h2>
          <p className="text-sm text-white/70">Join Velaro to unlock the full bespoke experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-white/70 mb-2 block">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-colors rounded-lg"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-white/70 mb-2 block">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-colors rounded-lg"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-white/70 mb-2 block">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 pl-4 pr-11 py-3 font-body text-sm text-white placeholder:text-white/40 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition-colors rounded-lg"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-3.5 hover:opacity-90 transition-opacity duration-300 font-semibold rounded-lg disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-center font-body text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="text-white/70 hover:text-[#d4af37] text-xs mt-1 transition-colors flex items-center gap-1.5 font-medium tracking-wide group"
          >
            Continue as guest <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default Signup;
