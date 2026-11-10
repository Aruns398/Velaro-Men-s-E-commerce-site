import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ShopSection from "@/components/ShopSection";
import BespokeSection from "@/components/BespokeSection";
import AppointmentSection from "@/components/AppointmentSection";
import ContactSection from "@/components/ContactSection";
import OrderDrawer from "@/components/OrderDrawer";
import Footer from "@/components/Footer";

const Index = () => {
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleNavigate = (section) => {
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOrderOpen = (product) => {
    setSelectedProduct(product);
    setOrderOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onNavigate={handleNavigate} />
      <HeroSection onNavigate={handleNavigate} />
      <ShopSection onOrderOpen={handleOrderOpen} />
      <BespokeSection onNavigate={handleNavigate} />
      <AppointmentSection />
      <ContactSection />
      <Footer />
      <OrderDrawer isOpen={orderOpen} onClose={() => { setOrderOpen(false); setSelectedProduct(null); }} product={selectedProduct} />
    </div>
  );
};

export default Index;
