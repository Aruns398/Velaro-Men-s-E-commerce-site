# 👔 Velaro — Men's E-Commerce & Bespoke Atelier

> A luxury, full-stack MERN e-commerce storefront and atelier administration suite.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Customer Storefront](#customer-storefront)
  - [Private Administration Workspace](#private-administration-workspace)
  - [Real-time Engine & Automated Receipts](#real-time-engine--automated-receipts)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Database Initialization](#4-database-initialization)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [Available Scripts](#-available-scripts)
- [Deployment Guide](#-deployment-guide)
- [License](#-license)

---

## 🌟 Overview

**Velaro** is an end-to-end luxury menswear storefront, bespoke tailoring booking platform, and back-office management dashboard. Designed with an editorial aesthetic inspired by Savile Row craftsmanship, Velaro delivers a seamless shopping experience for customers and comprehensive enterprise controls for shop administrators.

### Core Highlights
* **Seamless Omnichannel Shopping**: Product browsing, responsive shopping bag, multi-step checkout with instant order generation.
* **Bespoke Tailoring Appointments**: Integrated booking calendar for private styling and fitting sessions.
* **Velaro Admin Workspace**: Comprehensive dashboard featuring live KPI metrics, interactive Recharts analytics, order status workflows, product catalog manager with image uploads, and customer directory.
* **Real-time Live Sync**: Socket.IO integration delivering instant updates for orders and notifications across sessions.
* **Bespoke HTML Receipt Engine**: Automated transactional emails rendered with vintage perforated-ticket aesthetics via Nodemailer.

---

## 🚀 Key Features

### Customer Storefront
* **Curated Catalog**: Filter products across tailored categories (Blazers, Trousers, Shirts, Footwear, Knitwear, Outerwear).
* **Interactive Shopping Bag & Drawer**: Add to cart, adjust quantities, choose sizes, and review subtotal calculations with instant drawer feedback.
* **Checkout & Order Placement**: Support for Cash on Delivery (COD) and Online Payments with customer delivery details and phone validation.
* **Order History & Live Tracking**: Personalized order dashboard showing individual item fulfillment statuses (`Processing`, `Shipped`, `Delivered`, etc.).
* **Private Bespoke Appointment Booking**: Schedule appointments with date, preferred time slot, and service selection (Suit Fitting, Styling Consultation, Measurements).
* **Authentication & Protected Routes**: Secure token- and cookie-based authentication with user role enforcement (`customer` vs `admin`).

### Private Administration Workspace (`/admin`)
* **Real-time KPI Overview**: Live revenue figures, active orders, customer counts, and appointment metrics.
* **Interactive Sales Analytics**: Visual performance trends utilizing Recharts (Revenue curves, Order volume by date, Status distributions).
* **Order Fulfillment Center**: Real-time order monitoring with instant status updates (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`, `Refunded`).
* **Product Catalog Management**: Add new products with file upload (Multer disk storage), price, description, category, and delete out-of-stock items.
* **Appointment Scheduling Console**: Review incoming atelier appointments, assign internal notes, and update client statuses.
* **Export & Print Ready**: 
  * Export orders and reports directly to Microsoft Excel (`.xlsx`).
  * Print formatted physical packing slips and receipts directly from the browser.

### Real-time Engine & Automated Receipts
* **Socket.IO Live Notifications**: Instant real-time dispatch (`new_order` event) pinging administrators the moment a customer completes checkout.
* **Luxury HTML Receipt Emails**: Custom-styled email templates with punch-hole ticket styling, brand monogram, order itemization, and appointment confirmation details.
* **Fallback Sandbox Emailing**: Built-in Ethereal test mailer support for development environments without requiring immediate production SMTP credentials.

---

## 🛠 Tech Stack

### Frontend
| Technology | Description |
| :--- | :--- |
| **React 18** | Component-driven UI development |
| **Vite** | Fast modern build tool and dev server |
| **Tailwind CSS** | Utility-first responsive styling |
| **shadcn/ui & Radix UI** | Accessible, unstyled primitive component foundation |
| **Framer Motion** | Fluid animations and luxury transitions |
| **Recharts** | Interactive charts for administrative analytics |
| **Socket.IO Client** | Live WebSocket connection for instantaneous updates |
| **TanStack React Query** | Asynchronous state management and caching |
| **Lucide Icons** | Clean and consistent vector iconography |
| **XLSX (SheetJS)** | Client-side spreadsheet generation and export |
| **Sonner** | Modern toast notifications |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js** | Server-side JavaScript runtime environment |
| **Express 5** | High-performance RESTful routing and API framework |
| **MongoDB & Mongoose** | NoSQL document database and schema modeling |
| **Socket.IO** | Bi-directional event-based real-time communication |
| **JSON Web Tokens (JWT)** | Stateless and secure authentication |
| **Bcrypt.js** | Secure password hashing algorithm |
| **Multer** | Multipart/form-data handler for product imagery uploads |
| **Nodemailer** | Transporter for transactional order and appointment emails |
| **Cookie-Parser & CORS** | Secure cross-origin resource sharing and cookie handling |

---

## 📂 Project Architecture

```
mern-men-shop/
├── backend/
│   ├── assets/              # Static branding assets (logo, etc.)
│   ├── config/              # Database connection (Mongoose)
│   ├── controllers/         # Business logic (auth, admin, products, orders, appointments)
│   ├── middleware/          # JWT authentication and Admin role verifiers
│   ├── models/              # Mongoose schemas (User, Product, Order, Appointment)
│   ├── routes/              # Express API endpoints
│   ├── scripts/             # Diagnostic tools (testEmail.js)
│   ├── uploads/             # Product catalog images (Multer destination)
│   ├── utils/               # Email generation & template services
│   ├── .env.example         # Template for environment variables
│   ├── package.json         # Backend dependencies & run scripts
│   ├── seed.js              # Database seeder script
│   └── server.js            # Express server & Socket.IO initialization
│
├── frontend/
│   ├── public/              # Public web assets
│   ├── src/
│   │   ├── assets/          # Editorial photography and imagery
│   │   ├── components/      # UI components (Navbar, Hero, Bespoke, Shop, Admin)
│   │   │   └── ui/          # Radix & shadcn/ui component library
│   │   ├── contexts/        # React contexts (AuthContext, CartContext)
│   │   ├── hooks/           # Custom reusable React hooks
│   │   ├── lib/             # API client helpers and utility functions
│   │   ├── pages/           # Storefront & Admin routing views
│   │   │   ├── Admin.jsx    # Complete Velaro Admin Workspace
│   │   │   ├── Cart.jsx     # Shopping cart and checkout
│   │   │   ├── Index.jsx    # Main editorial landing page
│   │   │   ├── Orders.jsx   # Customer order tracking
│   │   │   └── Shop.jsx     # Full catalog browsing
│   │   ├── App.jsx          # Top-level routing and providers
│   │   └── main.jsx         # React application entry point
│   ├── package.json         # Frontend dependencies & build scripts
│   ├── tailwind.config.ts   # Tailwind design tokens and styling config
│   └── vite.config.ts       # Vite bundler configuration
│
├── mongo_data/              # Local MongoDB storage directory
├── start-db.bat             # Windows one-click script to launch local MongoDB
└── README.md                # Project documentation
```

---

## ⚙️ Getting Started

Follow these instructions to get a local copy of Velaro up and running on your machine.

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB Community Server installed or a cloud URI from [MongoDB Atlas](https://www.mongodb.com/atlas)

---

### 1. Clone Repository

```bash
git clone https://github.com/Aruns398/Velaro-Men-s-E-commerce-site.git
cd Velaro-Men-s-E-commerce-site
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `backend/` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your values (see [Environment Configuration](#-environment-configuration)).*

4. **Seed the database (Optional)**:
   Populate the database with the default user and product catalog:
   ```bash
   npm run seed
   ```

5. **Start the backend development server**:
   ```bash
   npm run dev
   ```
   *The API server will run at: `http://localhost:5000`*

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   *The storefront will launch at: `http://localhost:8080` (or `http://localhost:5173`)*

---

### 4. Database Initialization

* **Local MongoDB**: 
  You can run the provided Windows script:
  ```cmd
  start-db.bat
  ```
  Or start `mongod` manually:
  ```bash
  mongod --dbpath ./mongo_data
  ```
* **MongoDB Atlas**:
  Simply set `MONGO_URI` in `backend/.env` to your cloud connection string.

---

## 🔐 Environment Configuration

### Backend (`backend/.env`)

```ini
# Server Port
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/velaro_shop

# Authentication
JWT_SECRET=super_secure_jwt_secret_key_change_in_production

# Allowed Frontend Origins (comma-separated)
FRONTEND_URLS=http://localhost:8080,http://localhost:5173,http://localhost:3000

# ==========================================
# Email Notification Configuration (Nodemailer)
# ==========================================
# Gmail (Recommended for personal/testing):
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Or Custom SMTP (SendGrid, Mailgun, AWS SES, Outlook):
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USER=your_email@domain.com
# SMTP_PASS=your_smtp_password
```

> **Note**: If `EMAIL_USER` or `SMTP_USER` is not provided, the backend automatically activates **Ethereal Mail sandbox mode**, logging simulated email dispatch URLs directly in the server console for debugging.

### Frontend (`frontend/.env`) *(Optional in development)*

```ini
# Defaults to http://localhost:5000 in development
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new customer | No |
| `POST` | `/api/auth/login` | Authenticate customer/admin & receive token | No |
| `POST` | `/api/auth/logout` | Clear authentication session | Yes |

### Products (`/api/products`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all catalog products | No |
| `POST` | `/api/products` | Create product (multipart/form-data with image) | Admin |
| `DELETE` | `/api/products/:id` | Remove a product from the catalog | Admin |

### Orders (`/api/orders`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Place a new order from cart checkout | Yes |
| `GET` | `/api/orders` | Get order history for the logged-in customer | Yes |

### Bespoke Appointments (`/api/appointments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments` | Book a tailoring consultation session | No |
| `GET` | `/api/appointments` | List all appointments | Admin |

### Administration (`/api/admin`) *(Admin Access Required)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/me` | Fetch administrator profile |
| `GET` | `/api/admin/dashboard` | Retrieve high-level KPI and overview statistics |
| `GET` | `/api/admin/analytics` | Retrieve detailed sales and volume charts |
| `GET` | `/api/admin/orders` | Search and filter all store orders with pagination |
| `PATCH` | `/api/admin/orders/:orderId` | Update fulfillment status of an order |
| `GET` | `/api/admin/customers` | Retrieve customers list with lifetime spend and order count |
| `GET` | `/api/admin/appointments` | List all atelier consultation requests |
| `PATCH` | `/api/admin/appointments/:id`| Update appointment status and administrator notes |

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check API server and MongoDB connection status |

---

## 📜 Available Scripts

### In `backend/`:
* `npm run dev`: Starts the server with `nodemon` for auto-reloading during development.
* `npm start`: Runs the server in production mode using standard `node server.js`.
* `npm run seed`: Seeds the database with default customer credentials and products.
* `npm run test:email`: Runs diagnostic email verification script to validate SMTP credentials.

### In `frontend/`:
* `npm run dev`: Starts Vite local development server with Hot Module Replacement (HMR).
* `npm run build`: Compiles production-optimized client assets into the `dist/` directory.
* `npm run preview`: Locally preview the production build.
* `npm run lint`: Analyzes codebase with ESLint.
* `npm run test`: Runs unit and integration test suite with Vitest.

---

## 🌐 Deployment Guide

### Deploy Backend (e.g., Render, Railway, VPS)
1. Set the root directory to `backend/`.
2. Configure build command: `npm install`.
3. Set start command: `npm start`.
4. Configure all environment variables (`MONGO_URI`, `JWT_SECRET`, `FRONTEND_URLS`, `EMAIL_USER`, etc.).
5. Ensure `FRONTEND_URLS` includes your production frontend URL (e.g. `https://your-store.vercel.app`).

### Deploy Frontend (e.g., Vercel, Netlify)
1. Set the root directory to `frontend/`.
2. Set build command: `npm run build`.
3. Set output directory: `dist`.
4. Add environment variable `VITE_API_URL` pointing to your deployed backend API (e.g., `https://your-api.onrender.com/api`).

---

## 📄 License

This project is licensed for educational, portfolio, and personal evaluation purposes.

<p align="center">
  Crafted with care for <b>Velaro Atelier</b>.
</p>
