# ⚡ AeroX — E-Commerce Platform for Premium Gaming Gear

AeroX is a high-performance, full-stack e-commerce web application built for browsing, purchasing, and managing premium gaming equipment and peripherals.

---

## 🚀 Live Demo

* **Production Application:** [https://aerox-x1gj.onrender.com](https://aerox-x1gj.onrender.com)

---

## ✨ Features

* **Authentication & Authorization**
  * Local registration & JWT authentication with secure HTTP-only cookies.
  * One-tap **Google OAuth 2.0** authentication (via `google-auth-library`).
  * Role-based authorization (`user`, `admin`).

* **Product & Inventory Management**
  * Comprehensive filtering, sorting, field limiting, and pagination using custom API features.
  * Multi-image uploads and image processing powered by `Multer` and `Sharp`.

* **Checkout & Payments**
  * Integrated **Stripe Payment Gateway** for secure checkout.
  * Webhook handlers for real-time order confirmation.

* **User Reviews & Ratings**
  * Nested review endpoints linked directly to products and user profiles.

---

## 🛠️ Tech Stack

### **Backend & Core**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB & Mongoose ORM
* **Templating & UI:** Pug, Tailwind CSS

### **Authentication & Payments**
* **Authentication:** JSON Web Tokens (JWT), `google-auth-library`
* **Payments:** Stripe API
* **File Uploads:** Multer, Sharp

---

## ⚙️ Environment Variables

To run this project locally, create a `.env` file in the root directory and configure the following variables:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@cluster.mongodb.net/aerox?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📦 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/abdo-div/AeroX.git](https://github.com/abdo-div/AeroX.git)
   cd AeroX
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run start
Access the application:
Open http://localhost:3000 in your browser.


## 📡 API Endpoints Overview

* **`POST` /api/v1/users/signup** — Register a new user
* **`POST` /api/v1/users/login** — Authenticate existing user
* **`POST` /api/v1/users/google-auth** — Authenticate via Google OAuth
* **`GET` /api/v1/gadgets** — Fetch all products (supports filtering & pagination)
* **`POST` /api/v1/reviews** — Post a product review
* **`POST` /api/v1/bookings/checkout-session** — Generate Stripe checkout session

