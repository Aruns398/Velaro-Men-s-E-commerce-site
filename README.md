# Velaro Men's E-commerce Site

Velaro is a modern men’s fashion and grooming storefront built for premium lifestyle products. The project includes a luxury-inspired landing page, shopping cart, authentication, and order management features for a complete e-commerce experience.

## Screenshot

![Velaro storefront preview](https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80)

## Key Features

- Premium menswear and grooming product storefront
- Responsive landing page with hero, shop, bespoke, appointments, and contact sections
- Product listing and shopping cart flow
- User authentication and account access
- Order tracking and order history
- Elegant UI built with React and Tailwind CSS
- Express + MongoDB backend for app data and users

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB
- JWT authentication

## Project Structure

```bash
frontend/   # React frontend
backend/    # Express API and MongoDB models
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Aruns398/Velaro-Men-s-E-commerce-site.git
cd Velaro-Men-s-E-commerce-site
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Set up environment variables

Create a `.env` file inside the backend with your MongoDB connection string and JWT secret.

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URLS=http://localhost:8080,https://your-store.example
```

`FRONTEND_URLS` is a comma-separated allowlist for browser origins; include your deployed storefront origin so credentialed API and Socket.IO requests are accepted. In the frontend, set `VITE_API_URL` to the backend API base URL ending in `/api` (for example, `https://your-api.example/api`). For local development, the frontend defaults to `http://localhost:5000/api`.

### 5. Run the project

Start the backend:

```bash
cd backend
npm start
```

Start the frontend:

```bash
cd frontend
npm run dev
```

## Deployment

This project can be deployed on Vercel, Netlify, or any Node.js hosting platform with a connected MongoDB database.

## License

This project is for personal and portfolio use.
