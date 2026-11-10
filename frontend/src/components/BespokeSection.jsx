import { motion } from "framer-motion";
import { Ruler, Scissors, Crown } from "lucide-react";

const features = [
  { icon: Ruler, title: "Precision Measurements", desc: "Every measurement taken by master tailors for a perfect fit." },
  { icon: Scissors, title: "Hand-Cut Fabrics", desc: "Premium fabrics selected and cut individually for each garment." },
  { icon: Crown, title: "Wedding Specialists", desc: "Complete wedding party outfitting with coordinated styling." },
];

const BespokeSection = ({ onNavigate }) => {
  return (
    <section id="bespoke" className="py-24 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.3em] text-accent uppercase mb-3">The Velaro Experience</p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">Bespoke Craftsmanship</h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            From wedding suits to formal attire, every piece is crafted to your exact specifications with the finest materials.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card p-8 text-center shadow-product"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 gold-gradient mb-6">
                <f.icon size={24} className="text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => onNavigate("appointments")}
            className="gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider px-10 py-4 hover:opacity-90 transition-opacity duration-300"
          >
            Start Your Bespoke Journey
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default BespokeSection;
