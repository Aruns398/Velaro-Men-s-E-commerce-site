import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-primary">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.3em] text-accent uppercase mb-3">Get in Touch</p>
          <h2 className="font-display text-3xl md:text-4xl text-primary-foreground">Visit Our Atelier</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MapPin, title: "Address", lines: ["123 Anna Salai", "Chennai, Tamil Nadu 600002"] },
            { icon: Phone, title: "Phone", lines: ["+91 98765 43210", "+91 98765 43211"] },
            { icon: Mail, title: "Email", lines: ["velaro674@gmail.com"] },
            { icon: Clock, title: "Hours", lines: ["Mon–Sat: 10am–7pm", "Sunday: By Appointment"] },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 border border-accent/30 mb-4">
                <item.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-display text-lg text-primary-foreground mb-2">{item.title}</h3>
              {item.lines.map((line) => (
                <p key={line} className="font-body text-sm text-primary-foreground/60">{line}</p>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
