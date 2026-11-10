const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all localhost and 127.0.0.1 origins on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }
  // Allow local network IP addresses
  if (/^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin)) {
    return true;
  }
  return allowedOrigins.has(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const io = new Server(server, {
  cors: corsOptions
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected via socket:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Serve static files (uploads for product images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Velaro Groom Style API is running" });
});

// Health check
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "OK" : "ERROR",
    database: databaseConnected ? "connected" : "disconnected",
    message: "Velaro Groom Style API is running"
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const Product = require("./models/Product");

const defaultInitialProducts = [
  { name: 'Charcoal Wool Blazer', price: 23987, category: 'Blazers', image: '/uploads/product-1.jpg', description: 'Fine charcoal wool tailored blazer with structured shoulders.' },
  { name: 'Navy Slim Trousers', price: 3607, category: 'Trousers', image: '/uploads/product-2.jpg', description: 'Italian tailored slim-fit navy trousers.' },
  { name: 'Premium White Shirt', price: 2077, category: 'Shirts', image: '/uploads/product-3.jpg', description: 'Egyptian cotton classic spread-collar white dress shirt.' },
  { name: 'Leather Oxford Shoes', price: 2667, category: 'Footwear', image: '/uploads/product-4.jpg', description: 'Handcrafted full-grain leather oxford dress shoes.' },
  { name: 'Black Turtleneck', price: 8217, category: 'Knitwear', image: '/uploads/product-5.jpg', description: 'Ultra-fine merino wool black turtleneck sweater.' },
  { name: 'Olive Bomber Jacket', price: 8177, category: 'Outerwear', image: '/uploads/product-6.jpg', description: 'Modern luxury satin-finish olive bomber jacket.' }
];

connectDB().then(async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(defaultInitialProducts);
      console.log('Auto-seeded default products catalog.');
    }
  } catch (seedErr) {
    console.error('Initial product seed error:', seedErr.message);
  }

  server.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}`);
  });
});