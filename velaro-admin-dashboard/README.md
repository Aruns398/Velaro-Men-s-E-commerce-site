# Velaro admin dashboard (existing MERN project update)

This package contains the updated frontend and backend source folders. Dependencies and `.env` files are intentionally excluded.

## What is implemented

- `/admin/login` authenticates through the existing cookie/JWT login and then checks the account role against MongoDB.
- `/admin/dashboard` shows real order, customer, and appointment counts, an INR order-value chart, order statuses, and recent orders.
- `/admin/orders`, `/admin/customers`, and `/admin/appointments` provide paginated/searchable records. Order and appointment statuses can be updated.
- All `/api/admin/*` endpoints require a valid session and a database account with `role: "admin"`.
- The existing public appointment-list endpoint is now administrator-only because it exposes customer contact details.
- The customer-facing routes and existing login/signup flow remain in the source tree.

## Setup

1. In each folder, install dependencies with `npm install`.
2. Create `backend/.env` with `MONGO_URI`, `JWT_SECRET` (use a long random value), and `PORT=5000`.
3. Start the backend with `npm run dev` in `backend/`.
4. Start the frontend with `npm run dev` in `frontend/`. The API defaults to `http://localhost:5000/api`; set `VITE_API_URL` if needed.
5. Create a normal customer account using the existing signup page, then from `backend/` run `npm run promote-admin -- your-email@example.com`.
6. Visit `/admin/login` and use that account's normal credentials.

The promotion command only changes the role of an existing account. It does not create credentials or expose a default admin password.

## Existing data limitations

The supplied backend stores one order document per cart line and does not record payment settlement, refunds, cost, expenses, inventory, or products. The dashboard groups cart lines by checkout ID and labels financial totals as **order value**; these totals may include unpaid or cancelled orders. Appointment records have no prior status field, so missing statuses display as Pending. The customer storefront currently uses a hardcoded sample product list and there is no product API. Product/inventory administration, collected revenue/profit reporting, XLSX export, and related features from the pasted brief remain unimplemented pending suitable existing data models and payment/product integration.

## Verification

Backend JavaScript syntax checks passed. A frontend production build was not run: the supplied archive's preinstalled dependencies require more disk space than was available in the workspace. No database connection was configured here, so admin authorization and live data queries were not exercised against MongoDB.
