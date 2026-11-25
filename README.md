<div align="center">

# 🛍️ Gupta General Store
### Modern E-Commerce Platform & Enterprise Business Administration Suite

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-orange?style=for-the-badge)](#license)

**Established in 1990 in Bakani, Rajasthan**, Gupta General Store is a high-performance, full-stack digital commerce web application. Built for students, educational institutions, offices, and households, the platform features a consumer-facing retail storefront, integrated PWA offline capabilities, AI-powered customer assistance, and a multi-tenant business administration control panel.

[Live Demo](#) · [Report Bug](#) · [Request Feature](#) · [Admin Portal](#owner-admin-suite-admin)

</div>

---

## 📑 Table of Contents

- [Overview & Vision](#-overview--vision)
- [Key Features](#-key-features)
  - [Customer Storefront](#1-customer-storefront)
  - [Owner Admin Suite (`/admin`)](#2-owner-admin-suite-admin)
  - [AI Customer Support](#3-ai-customer-support-assistant)
  - [Progressive Web App (PWA)](#4-progressive-web-app-pwa)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [CSS Architecture & Performance](#-css-architecture--performance)
- [Database & Security Design](#-database--security-design)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Documentation & Guides](#-documentation--guides)
- [Contributing & Code Standards](#-contributing--code-standards)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🔭 Overview & Vision

Gupta General Store bridges traditional high-trust neighborhood retail with modern digital commerce standards. It delivers instant, zero-latency catalog browsing, seamless mobile-first responsive interactions, multi-factor authenticated owner access, and real-time order tracking with SMS/Email notifications.

### Design Principles
- **Speed & Efficiency**: Modular CSS architecture, zero unnecessary bundle overhead, GPU-accelerated smooth scrolling, and sub-second page transitions.
- **Brand Identity**: Gupta Store Dark Navy (`#0f172a`) paired with Signature Orange (`#f97316`) accents and clean typography using Inter & Outfit.
- **Reliability**: Strict adherence to React 19 component hook contracts, isolated domain stylesheets, and automated multi-viewport verification.

---

## ✨ Key Features

### 1. Customer Storefront
- **Instant Product Discovery**: Instant live filtering, multi-category chips, sorting (Price, Ratings, Discounts), and layout toggle (Grid view & List view).
- **Dynamic Shopping Cart**: Slide-out cart drawer, instantaneous item quantity counters, instant coupon application, and delivery breakdown.
- **Checkout & Payments**: Flexible payment choices with Cash on Delivery (COD) and Razorpay online payments.
- **Real-Time Order Tracking**: Dedicated order timeline (`/track`), live delivery progress updates, instant invoice generation, and WhatsApp order support.
- **Wishlist & Favorites**: Persistent wishlist with local storage synchronization.
- **Dual Authentication Modes**: Passwordless OTP login via SMS (Twilio) and Email (SMTP / Resend), plus standard credential auth.

### 2. Owner Admin Suite (`/admin`)
An enterprise-grade operational dashboard designed for day-to-day store management:
- **Operations Dashboard**: Live KPI cards showing Total Revenue, Total Orders, Pending Fulfillments, and Active Catalog Count derived directly from PostgreSQL.
- **Order Processing Hub**: Status pipeline (Placed → Confirmed → Packed → Shipped → Delivered → Cancelled), customer address cards, and single-click CSV export.
- **Catalog Management**: Full CRUD product creation, image uploading to Supabase Storage, pricing/MRP controls, and low-stock alerts.
- **Customer Directory**: Customer profiles, order history aggregation, and contact shortcuts.
- **Marketing & Promotions**: Custom coupon creation (percentage or flat discounts, validity periods, usage limits) and promotional banner management.
- **Reviews & Moderation**: Customer review approval, star-rating analytics, and feedback moderation.
- **Multi-Factor Owner Security**: Two-Step Verification (Admin Password + Email OTP) with Master Emergency Recovery Keys.
- **Device Support**: Collapsible desktop sidebar with tooltips, and a mobile navigation drawer with bottom action sheets.

### 3. AI Customer Support Assistant
- Integrated AI support bot (`Chatbot.js`) that recognizes customer orders, explains shipping timelines, assists with item replacement, and provides instant order-contextual solutions.
- One-click order inquiry bridging directly to local WhatsApp support.

### 4. Progressive Web App (PWA)
- Offline capability, custom service worker (`public/sw.js`), web app manifest (`manifest.json`), and native-like install prompt banner.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with [Turbopack](https://turbo.build/pack) |
| **UI Library** | [React 19](https://react.dev/) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) (Cart, Wishlist, UI, Auth stores) |
| **Styling** | Modular Domain CSS (`src/styles/`) + [Tailwind CSS 3.4](https://tailwindcss.com/) |
| **Icons & Media** | [Lucide React](https://lucide.dev/) |
| **Motion** | [Framer Motion](https://www.framer.com/motion/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| **Payments** | [Razorpay](https://razorpay.com/) Payment Gateway SDK |
| **SMS & Messaging** | [Twilio](https://www.twilio.com/) API (SMS OTP delivery) |
| **Email Delivery** | [Nodemailer](https://nodemailer.com/) (Gmail SMTP / Custom SMTP) & [Resend](https://resend.com/) |

---

## 📁 Project Architecture

```
gupta-store-nextjs/
├── database/                   # Supabase database DDL, seeds & tools
│   ├── schema.sql              # Master DDL (Profiles, Products, Orders, RLS policies)
│   ├── README.md               # Supabase database setup instructions
│   ├── seeds/                  # Seed datasets
│   │   ├── products.sql        # 50+ curated stationery items
│   │   ├── orders.sql          # Order sample records
│   │   └── product-extra-data.sql # Attributes, badges, and metadata
│   └── tools/                  # Product migration & audit scripts
├── docs/                       # Detailed operational & setup guides
│   ├── OTP_SYSTEM.md           # Unified OTP verification architecture
│   ├── SMS_SETUP_GUIDE.md      # Quick SMS integration guide
│   └── TWILIO_SETUP.md         # Production Twilio configuration
├── public/                     # Static assets, PWA manifest & icons
│   ├── logo.png                # Official brand logo
│   ├── manifest.json           # PWA Web App Manifest
│   ├── sw.js                   # Service worker for offline assets
│   └── images/products/        # Local product image assets
├── src/
│   ├── app/                    # Next.js App Router (Pages & API endpoints)
│   │   ├── admin/              # Admin Portal (Dashboard, Orders, Catalog, etc.)
│   │   ├── api/                # Backend API routes
│   │   │   ├── admin/          # Admin-protected endpoints (login, orders, settings)
│   │   │   ├── auth/           # Customer auth (otp, verify, password)
│   │   │   ├── cart/           # Server-side cart operations
│   │   │   ├── orders/         # Order creation & tracking
│   │   │   └── products/       # Product catalog queries
│   │   ├── auth/               # Customer Login / Registration page
│   │   ├── cart/               # Cart review & multi-step checkout
│   │   ├── orders/             # Customer order history & tracking
│   │   ├── track/              # Public live order tracking
│   │   ├── globals.css         # Master 13-line CSS orchestrator
│   │   ├── layout.js           # Root layout & Chrome wrapper
│   │   └── page.js             # Customer storefront homepage
│   ├── components/             # Reusable UI components
│   │   ├── AppChrome.js        # Global wrapper (Navbar, Ticker, Chatbot, Footer)
│   │   ├── Chatbot.js          # AI Customer Support widget
│   │   ├── Footer.js           # Multi-column footer & trust banner
│   │   ├── Navbar.js           # Responsive header with search & cart count
│   │   ├── ProductCard.js      # Catalog card with fallback handling
│   │   └── MobileBottomNav.js  # Mobile tab navigation
│   ├── lib/                    # Core utilities, stores & Supabase client
│   │   ├── config.js           # Store metadata & constants
│   │   ├── store.js            # Zustand stores (Cart, Auth, Wishlist, UI)
│   │   ├── supabase.js         # Supabase client & admin client
│   │   └── utils.js            # Currency & date formatters
│   └── styles/                 # Modular CSS architecture
│       ├── variables.css       # Design tokens, color palette, typography
│       ├── base.css            # CSS reset, typography, universal buttons (.btn)
│       ├── components.css      # Header, Footer, Modals, Toasts & Tickers
│       ├── storefront.css      # Product cards, catalog grid, filter drawer
│       ├── cart.css            # Cart drawer, bill breakdown, coupons
│       ├── orders.css          # Orders cards, delivery timeline tracking
│       ├── auth.css            # Auth modals, OTP input boxes, profile
│       ├── responsive.css      # Mobile (<640px) & tablet (<1024px) media queries
│       └── admin-legacy.css    # Admin dedicated styling (isolated from storefront)
├── scripts/                    # Test & validation scripts
│   ├── analyze_css.cjs         # CSS bracket validator
│   ├── test_db.cjs             # Supabase database connectivity test
│   ├── test_rls.cjs            # Row Level Security policy test
│   └── verify_app.cjs          # Next.js application verification
├── .env.example                # Sanitized environment template
├── .env.local.example          # Comprehensive setup guide with comments
├── .gitignore                  # Git ignore rules (protects .env.local & binaries)
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies & scripts
└── tailwind.config.js          # Tailwind CSS configuration
```

---

## 🎨 CSS Architecture & Performance

The styling system has been partitioned into **modular domain stylesheets** under `src/styles/` to minimize CSSOM parsing overhead and prevent render blocking:

- **`variables.css`**: Color system (Navy, Orange, Emerald, Amber, Slate), elevations, and font declarations.
- **`base.css`**: Performance reset with hardware acceleration (`translateZ(0)`), typography hierarchy, and the **Universal Button System** (`.btn`, `.btn-orange`, `.btn-load-more`, `.btn-navy`).
- **`components.css`**: Global UI elements like Top Ticker, Header/Navbar, Search Dropdown, Modals, and Trust Strips.
- **`storefront.css`**: Hero banner, Category chips strip, Product grid, Product cards, and Filter panel.
- **`cart.css`**: Slide-out cart drawer, item counter, promo coupons, and bill summary breakdown.
- **`orders.css`**: Order status chips, delivery timeline tracking, and action buttons.
- **`auth.css`**: Tabbed authentication shell, floating labels, and OTP verification inputs.
- **`responsive.css`**: Consolidated media queries ensuring 0px horizontal overflow across mobile and tablet viewports.
- **`admin-legacy.css`**: Isolated admin styling loaded strictly when navigating into `/admin`.

---

## 🔒 Database & Security Design

### Supabase PostgreSQL Schema
- **`profiles`**: Linked directly to `auth.users` for customer metadata and role management (`customer` vs `owner`).
- **`products`**: Catalog items with pricing, MRP, stock levels, category, tags, and image URLs.
- **`orders`**: Customer order records containing item JSON arrays, delivery address, payment method (`cod` / `online`), and fulfillment status.
- **`categories`**, **`coupons`**, **`reviews`**, **`inquiries`**: Dedicated relational tables.

### Security Guarantees
- **Row Level Security (RLS)**: Enforced across all tables. Public access is granted for read-only catalog browsing; write operations require authenticated sessions or service-role delegation.
- **Admin 2-Step Verification**: Protected with SHA-256 HMAC session tokens and secondary email verification.
- **Credential Protection**: Real secrets, tokens, and local database keys are strictly isolated in `.env.local` and excluded by `.gitignore`.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# ── SUPABASE (Database, Auth & Storage) ────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ── OWNER ADMIN PORTAL SECURITY ───────────────────────────────
ADMIN_PASSWORD=your_secure_admin_password_here
ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_BACKUP_KEY=123456

# ── EMAIL & SMTP NOTIFICATIONS ────────────────────────────────
EMAIL_USER=your_store_email@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
EMAIL_FROM="Gupta General Store <your_store_email@gmail.com>"
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# RESEND_API_KEY=re_your_resend_key

# ── SMS OTP (TWILIO) ──────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# ── RAZORPAY PAYMENT GATEWAY ──────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id

# ── APPLICATION SETTINGS ──────────────────────────────────────
NEXT_PUBLIC_STORE_NAME="Gupta General Store"
NEXT_PUBLIC_STORE_LOCATION="Bakani, Rajasthan"
NEXT_PUBLIC_STORE_PHONE="+91-8107615285"
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9 or newer

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/gupta-store.git
   cd gupta-store
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Initialization:**
   - Go to [Supabase Console](https://supabase.com).
   - In the **SQL Editor**, paste and execute `database/schema.sql`.
   - (Optional) Execute `database/seeds/products.sql` to populate initial stationery items.
   - Under **Storage**, create a public bucket named `product-images`.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Production Build & Execution:**
   ```bash
   npm run build
   npm start
   ```

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `next dev` | Starts Next.js development server with Turbopack hot reloading |
| **`npm run build`** | `next build` | Compiles optimized production bundle & prerenders static pages |
| **`npm start`** | `next start` | Runs the compiled Next.js production server |
| **`node scripts/verify_app.cjs`** | `node scripts/...` | Verifies application health and API connectivity |
| **`node scripts/test_db.cjs`** | `node scripts/...` | Tests live Supabase database connectivity |
| **`node scripts/analyze_css.cjs`** | `node scripts/...` | Validates CSS syntax and bracket balance across all modular stylesheets |

---

## 📚 Documentation & Guides

Additional operational guides are organized in the [`docs/`](./docs) folder:
- [Unified OTP System Architecture](./docs/OTP_SYSTEM.md): Explains the shared in-memory and persistent OTP store mechanism.
- [SMS Integration Quickstart](./docs/SMS_SETUP_GUIDE.md): 3-step setup guide for SMS delivery.
- [Twilio Configuration Manual](./docs/TWILIO_SETUP.md): In-depth configuration guide for production SMS gateways.
- [Database Setup Guide](./database/README.md): Detailed schema setup, table definitions, and seed instructions.

---

## 🤝 Contributing & Code Standards

1. **Branch Naming**: Use feature branches (`feature/storefront-filter`, `fix/mobile-navigation`).
2. **React Hooks Standards**: Never call React hooks conditionally or after early return statements. All hooks must execute at the top level.
3. **CSS Organization**: Keep global styling modularized in `src/styles/`. Avoid large monolithic CSS files.
4. **Environment Safety**: Never commit `.env.local` or files containing live credentials.

---

## 📄 License & Acknowledgements

- **Proprietary Commercial Software**: Developed specifically for **Gupta General Store**, Bakani, Rajasthan.
- **Copyright**: © 2026 Gupta General Store. All rights reserved.
- **Credits**: Built with Next.js, React, Supabase, Tailwind CSS, and Lucide Icons.
