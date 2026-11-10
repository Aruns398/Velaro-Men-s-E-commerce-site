import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "velaro_auth_user";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const signin = async ({ email, password }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.msg || "Login failed");
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const signup = async ({ name, email, password }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.msg || "Registration failed");
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const continueAsGuest = () => {
    try {
      fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    } catch {
      // ignore
    }

    const guestUser = {
      _id: "guest_" + Math.random().toString(36).substring(2, 9),
      name: "Guest",
      email: "guest@velaro.com",
      role: "guest",
      isGuest: true
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
    return guestUser;
  };

  const signout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      signin,
      signup,
      signout,
      continueAsGuest,
      isAuthenticated: Boolean(user),
      isGuest: Boolean(user?.isGuest),
      loading
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
