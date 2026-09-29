# HAMAR Electronics — Backend API

Production-ready Node.js & Express REST API backend for the **HAMAR Electronics E-commerce Website**.

Built to integrate seamlessly with the existing HAMAR frontend while keeping the approved UI design 100% untouched.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables Setup](#environment-variables-setup)
  - [Database Seeding](#database-seeding)
  - [Running the Server](#running-the-server)
- [Authentication Strategy](#authentication-strategy)
  - [Customer Authentication (Firebase + MongoDB)](#customer-authentication-firebase--mongodb)
  - [Guest User Order Flow](#guest-user-order-flow)
  - [Admin Role & Authorization](#admin-role--authorization)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Authentication](#authentication)
  - [Products](#products)
  - [Categories](#categories)
  - [Brands](#brands)
  - [Orders](#orders)
  - [Admin](#admin)
- [Security Features](#security-features)
- [Deployment Instructions](#deployment-instructions)

---

## Architecture Overview

HAMAR uses a decoupled full-stack architecture:

```
hamar/
├── hamar-frontend/   (React 19 + Vite + Tailwind CSS)
└── hamar-backend/    (Node.js + Express + MongoDB + Firebase Admin)
```

- **Frontend:** Manages UI, in-memory cart, wishlist, compare, and client-side Firebase sessions.
- **Backend:** Serves REST APIs for product catalog, categories, brands, orders, customer profiles, and admin operations.
- **Database:** MongoDB stores application data (products, categories, brands, orders, users).
- **Authentication:** Firebase Authentication manages password security, account creation, and tokens. Firebase Admin SDK verifies tokens on the server.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js (>=18)** | JavaScript runtime |
| **Express.js** | HTTP REST API framework |
| **MongoDB & Mongoose** | Document database & object modeling |
| **Firebase Admin SDK** | Server-side Firebase ID token verification |
| **Helmet** | HTTP security headers |
| **CORS** | Cross-Origin Resource Sharing |
| **Morgan** | HTTP request logger |
| **express-rate-limit** | IP-based request throttling & DDoS mitigation |

---

## Project Directory Structure

```text
hamar-backend/
├── scripts/
│   └── seed.js                # Database seeder (categories, brands, products)
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB Mongoose connection
│   │   └── firebaseAdmin.js   # Firebase Admin SDK initialization
│   ├── controllers/
│   │   ├── authController.js      # Register sync, profile lookup & update
│   │   ├── productController.js   # Product query, slug lookup, CRUD
│   │   ├── categoryController.js  # Category list with live product counts
│   │   ├── brandController.js     # Brand list with live product counts
│   │   └── orderController.js     # Guest & auth order placement, admin
│   ├── middleware/
│   │   ├── authMiddleware.js      # requireAuth & optionalAuth
│   │   ├── adminMiddleware.js     # requireAdmin role check
│   │   ├── errorMiddleware.js     # Centralized error handler
│   │   └── notFoundMiddleware.js  # 404 handler for unmatched routes
│   ├── models/
│   │   ├── User.js                # Customer & Admin user schema
│   │   ├── Product.js             # E-commerce product schema (mirrors UI)
│   │   ├── Category.js            # Category schema
│   │   ├── Brand.js               # Brand schema (history, whyChoose, etc.)
│   │   └── Order.js               # Order schema (guest & auth support)
│   ├── routes/
│   │   ├── healthRoutes.js        # GET /api/health
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── productRoutes.js       # /api/products
│   │   ├── categoryRoutes.js      # /api/categories
│   │   ├── brandRoutes.js         # /api/brands
│   │   ├── orderRoutes.js         # /api/orders
│   │   └── adminRoutes.js         # /api/admin
│   ├── utils/
│   │   ├── response.js            # Standardized JSON response helpers
│   │   └── helpers.js             # Order number generator, slugify, ObjectId check
│   ├── app.js                 # Express application setup & middleware
│   └── server.js              # Server entry point & listener
├── .env.example               # Environment variable documentation
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** instance (Local MongoDB or free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Firebase Project** with Authentication enabled (Email/Password)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd hamar-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hamar?retryWrites=true&w=majority

# Firebase Admin SDK (From Firebase Console -> Service Accounts -> Generate new private key)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

> [!NOTE]
> Keep the literal `\n` in the private key string when pasting into `.env`. The backend automatically converts `\n` to real line breaks.

### Database Seeding

To seed the initial 8 categories, 8 brands, 30 products, and default admin account from the existing frontend data:

```bash
npm run seed
```

This clears and safely populates MongoDB with authentic product specifications, images, and prices.

### Running the Server

- **Development mode** (auto-reloads on changes using Node's native `--watch`):
  ```bash
  npm run dev
  ```

- **Production mode**:
  ```bash
  npm start
  ```

---

## Authentication Strategy

### Customer Authentication (Firebase + MongoDB)

1. Customer registers or logs in via Firebase client SDK on the frontend.
2. Firebase returns a signed ID token (JWT).
3. The frontend calls `POST /api/auth/register` with `Authorization: Bearer <idToken>`.
4. The backend verifies the token using Firebase Admin SDK and links the `firebaseUid` to a MongoDB User profile.
5. All subsequent authenticated requests include `Authorization: Bearer <idToken>`.

### Guest User Order Flow

Guest customers **never** have to log in or create an account to browse products or place an order:
- Product list, filters, search, and product details are 100% public.
- In-memory cart allows adding items without authentication.
- Checkout accepts guest contact details (`name`, `email`, `phone`, `address`, `city`).
- `POST /api/orders` uses `optionalAuth`: if no token is provided, the order is created with `user: null`.

### Admin Role & Authorization

1. When a user requests an admin route (`/api/admin/*` or `POST /api/products`), `requireAdmin` middleware executes.
2. `requireAuth` first verifies the Firebase ID token.
3. The user record is fetched from MongoDB by `firebaseUid`.
4. The server inspects `user.role === 'admin'`. Roles sent from the client body or headers are **never trusted**.

---

## API Reference

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server status & uptime check |

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Authenticated | Sync Firebase user profile into MongoDB |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |
| `PUT` | `/api/auth/me` | Authenticated | Update current user name & phone |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | List products (category, brand, search, price, sort) |
| `GET` | `/api/products/slug/:slug` | Public | Get single product by URL slug |
| `GET` | `/api/products/:id/related` | Public | Get related products by category/brand |
| `GET` | `/api/products/:id` | Public | Get product by MongoDB ObjectId |
| `POST` | `/api/products` | Admin | Create product |
| `PUT` | `/api/products/:id` | Admin | Update product |
| `DELETE` | `/api/products/:id` | Admin | Soft-delete product |

### Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all categories with live product count |
| `GET` | `/api/categories/:slug` | Public | Get category details by slug |
| `POST` | `/api/categories` | Admin | Create category |
| `PUT` | `/api/categories/:id` | Admin | Update category |
| `DELETE` | `/api/categories/:id` | Admin | Soft-delete category |

### Brands

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/brands` | Public | List all brands with live product count |
| `GET` | `/api/brands/:slug` | Public | Get brand details by slug |
| `POST` | `/api/brands` | Admin | Create brand |
| `PUT` | `/api/brands/:id` | Admin | Update brand |
| `DELETE` | `/api/brands/:id` | Admin | Soft-delete brand |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Public / Guest | Place order (guest or authenticated) |
| `GET` | `/api/orders/my-orders` | Authenticated | Customer's own order history |
| `GET` | `/api/orders/:id` | Public / Auth | Order lookup by orderNumber (e.g. `ORD-10234`) |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Admin | Live totals, paid revenue, and recent orders |
| `GET` | `/api/admin/orders` | Admin | List all orders with pagination & status filter |
| `GET` | `/api/admin/orders/:id` | Admin | View full order detail |
| `PUT` | `/api/admin/orders/:id/status` | Admin | Update order status or payment status |
| `DELETE` | `/api/admin/orders/:id` | Admin | Cancel / remove order |
| `GET` | `/api/admin/customers` | Admin | List/search customers with pagination |
| `GET` | `/api/admin/customers/:id` | Admin | View customer profile and recent orders |
| `PUT` | `/api/admin/customers/:id/status` | Admin | Activate or deactivate a customer account |

Product, category, and brand management uses the admin-protected `POST`, `PUT`, and `DELETE` routes in each respective resource API above.

---

## Security Features

- **No Passwords in MongoDB**: Firebase manages all credentials and hashing.
- **Server-Side Price Calculation**: Total price and delivery fee are recalculated on the server during checkout to prevent client-side price tampering.
- **Helmet**: Secures HTTP response headers against clickjacking, MIME sniffing, and cross-site scripting.
- **Rate Limiting**: Throttles incoming requests to 200 requests per 15-minute window per IP.
- **CORS Whitelisting**: Restricted to `CLIENT_URL` (default `http://localhost:5173`).
- **Role Verification**: Admin permissions are strictly verified against the database record, never trusted from client input.
- **Data Validation & Sanitization**: Incoming request parameters are sanitized against regex injection and validated.

---

## Deployment Instructions

### Deploy to Render / Railway / Heroku

1. Create a MongoDB database on [MongoDB Atlas](https://cloud.mongodb.com/).
2. Push repository to GitHub.
3. Create a new Web Service pointing to `hamar-backend/`.
4. Configure environment variables in the host dashboard:
   - `NODE_ENV=production`
   - `PORT=5000` (or host assigned port)
   - `CLIENT_URL=https://your-frontend-domain.com`
   - `MONGODB_URI=mongodb+srv://...`
   - `FIREBASE_PROJECT_ID=...`
   - `FIREBASE_CLIENT_EMAIL=...`
   - `FIREBASE_PRIVATE_KEY=...`
5. Set start command: `npm start`
6. Run the seeder once via web console or SSH: `npm run seed`
