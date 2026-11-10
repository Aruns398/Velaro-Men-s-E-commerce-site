import { motion } from "framer-motion";
import heroBespoke from "@/assets/hero-bespoke.jpg";
import heroTrendy from "@/assets/hero-trendy.jpg";

const HeroSection = ({ onNavigate }) => {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col md:flex-row">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex-1 flex items-center justify-center overflow-hidden group cursor-pointer min-h-[50vh] md:min-h-screen"
        onClick={() => onNavigate("bespoke")}
      >
        <img src={heroBespoke} alt="Bespoke tailored suits" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 text-center px-8">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="font-body text-xs tracking-[0.3em] text-accent uppercase mb-4">
            Made to Measure
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-6">
            Bespoke <br /> Tailoring
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            onClick={(e) => { e.stopPropagation(); onNavigate("appointments"); }}
            className="gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider px-8 py-3 hover:opacity-90 transition-opacity duration-300"
          >
            Book Appointment
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex-1 flex items-center justify-center overflow-hidden group cursor-pointer min-h-[50vh] md:min-h-screen"
        onClick={() => onNavigate("shop")}
      >
        <img src={heroTrendy} alt="Trendy men's fashion" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-secondary/60" />
        <div className="relative z-10 text-center px-8">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="font-body text-xs tracking-[0.3em] text-accent uppercase mb-4">
            New Collection
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }} className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-6">
            Trendy <br /> Styles
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            onClick={(e) => { e.stopPropagation(); onNavigate("shop"); }}
            className="border border-accent text-accent font-body text-sm uppercase tracking-wider px-8 py-3 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
          >
            Shop Now
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
