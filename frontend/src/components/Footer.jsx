import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary border-t border-secondary py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/velaro-logo.jpg"
                alt="Velaro Emblem"
                className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/40 shadow-sm"
              />
              <h3 className="font-display text-xl tracking-[0.2em] text-primary-foreground">VELARO</h3>
            </div>
            <p className="font-body text-sm text-primary-foreground/50 leading-relaxed">
              Premium men's bespoke tailoring and curated fashion. Crafted for the modern gentleman.
            </p>
          </div>
          <div>
            <h4 className="font-body text-xs uppercase tracking-wider text-accent mb-4">Services</h4>
            <ul className="space-y-2">
              {["Bespoke Suits", "Wedding Attire", "Formal Wear", "Alterations"].map((s) => (
                <li key={s} className="font-body text-sm text-primary-foreground/50 hover:text-accent transition-colors cursor-pointer">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-xs uppercase tracking-wider text-accent mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="font-body text-sm text-primary-foreground/50 flex items-center gap-2">
                <Mail size={14} className="text-accent shrink-0" />
                <a
                  href="mailto:velaro674@gmail.com"
                  className="hover:text-accent transition-colors text-primary-foreground/70"
                >
                  velaro674@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary pt-8 text-center">
          <p className="font-body text-xs text-primary-foreground/30 tracking-wider">
            © 2026 Velaro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
