# Velaro Men's E-commerce Site

Velaro is a modern men’s fashion storefront built for premium grooming and lifestyle products. The application includes a landing page, product browsing, cart flow, order tracking, and authentication features for a complete e-commerce experience.

## Project Highlights

- Premium menswear and grooming product storefront
- Responsive landing page with hero, shop, bespoke, appointments, and contact sections
- Product listing and shopping cart functionality
- User sign-up and login flow
- Order management and order history
- Clean, luxury-inspired UI using React and Tailwind CSS
- Express + MongoDB backend for authentication and orders

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui components
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

## Features

- Men’s fashion storefront with curated collections
- Secure user authentication
- Cart and checkout experience
- Order tracking for customers
- Responsive interface for desktop and mobile
- Appointment and bespoke inquiry sections

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

Create a `.env` file in the backend with your MongoDB connection and JWT secret.

Example:

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

### 5. Run the application

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

## Live Demo

This project is designed for a modern premium men’s e-commerce experience and can be deployed to platforms such as Vercel, Netlify, or a custom VPS.

## License

This project is for personal and portfolio use.
