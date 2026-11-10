import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    // Only attempt fetch if user is authenticated and not a mock guest
    if (!user || user.isGuest) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  // Synchronize orders whenever the logged-in email account changes
  useEffect(() => {
    if (user && !user.isGuest) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user?._id, user?.email, fetchOrders]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, size, quantity) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item =>
        item.id === product.id && item.size === size
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, size, quantity }];
      }
    });
  };

  const removeFromCart = (id, size) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (paymentMethod = "Online Payment", shippingDetails = { address: "Coimbatore", phone: "", email: "" }) => {
    if (cart.length === 0) return;

    try {
      const newOrderData = {
        items: [...cart],
        paymentMethod,
        address: shippingDetails.address,
        phone: shippingDetails.phone,
        email: shippingDetails.email || user?.email || ""
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newOrderData)
      });

      if (res.ok) {
        const savedData = await res.json();
        const newOrders = savedData.orders || (savedData.order ? [savedData.order] : []);
        setOrders(prevOrders => [...newOrders, ...prevOrders]);
        clearCart();
        fetchOrders();
      } else {
        console.error("Failed to save order");
        clearCart();
      }
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      orders,
      loadingOrders,
      fetchOrders,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      placeOrder,
      getCartTotal,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
