<div align="center">

# 🛍️ Gupta General Store
### Modern E-Commerce Web Platform & Enterprise Store Administration Suite

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-orange?style=for-the-badge)](#license)

**Established in 1990 in Bakani, Rajasthan**, Gupta General Store is a production-ready, full-stack digital commerce platform tailored for students, teachers, schools, offices, and households. The platform combines a blazing-fast retail shopping experience with an operational business administration portal for direct store oversight.

[Live Storefront](#-customer-storefront-features) · [Owner Admin Suite](#-owner-admin-suite-admin) · [Database Setup](#-database--supabase-setup) · [Getting Started](#-getting-started)

</div>

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Customer Storefront Features](#-customer-storefront-features)
- [Owner Admin Suite (`/admin`)](#-owner-admin-suite-admin)
- [AI Customer Support Assistant](#-ai-customer-support-assistant)
- [Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [CSS Architecture & Performance](#-css-architecture--performance)
- [Database & Supabase Setup](#-database--supabase-setup)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🔭 Project Overview

Gupta General Store modernizes neighborhood retail operations through an efficient, cloud-backed architecture. It provides customer self-service, instant catalog browsing, frictionless checkout with Cash on Delivery (COD), live order tracking, and a dedicated multi-tab administration portal for daily store fulfillment.

### Core Architecture Highlights
- **Full-Stack Next.js 16**: App Router architecture utilizing Turbopack compilation and dynamic server-rendered API routes.
- **Unified PostgreSQL Backend**: Powered entirely by **Supabase** for relational data persistence, public image storage buckets, and Row Level Security (RLS).
- **Zero Heavy Third-Party Bloat**: Operates cleanly without external payment gateways or third-party database proxies. Payment is handled via Cash on Delivery (COD) and direct WhatsApp order confirmation.
- **Modular Domain CSS**: Clean CSS engine split across 9 dedicated stylesheets under `src/styles/`, eliminating render-blocking stylesheets and ensuring 0px horizontal layout overflow across all viewports.
- **Strict React 19 Standards**: Unconditional top-level React hooks execution ensuring zero runtime hook order violations.

---

## 🛒 Customer Storefront Features

- **Dynamic Product Catalog**: Browse 50+ curated stationery items across pens, pencils, notebooks, files, art supplies, and accessories.
- **Real-Time Search & Filtering**: Instant search by product name, SKU, or tag; category filtering chips; and sorting by price, popularity, or rating.
- **Interactive View Modes**: Seamless toggle between multi-column Product Grid View and high-information List View.
- **Slide-Out Cart Drawer**: Fast item counters, real-time bill breakdown (Subtotal, Delivery Fee, Taxes), and promotional coupon code validation.
- **Cash on Delivery (COD) Checkout**: Streamlined multi-step checkout requiring no payment card hassles. Direct customer address entry with auto-saved local preferences.
- **Live Order Tracking (`/track`)**: Visual step-by-step order progress timeline (Order Placed → Confirmed → Packing → Out for Delivery → Delivered).
- **Digital Invoices & Receipts**: Instant order summary view with one-click WhatsApp order verification and customer inquiry routing.
- **Customer Wishlist**: Local storage-synced wishlist accessible from navigation and product cards.

---

## 💼 Owner Admin Suite (`/admin`)

The operational control center built specifically for daily shop management:

- **Operations Dashboard**: Real-time KPI metrics showing Total Revenue, Total Orders, Pending Fulfillments, and Active Products derived directly from Supabase PostgreSQL queries.
- **Order Management Pipeline**: Process incoming orders, update live delivery statuses, inspect customer delivery addresses, and export order history to CSV.
- **Product Catalog Management**: Create, edit, and delete products; upload images directly to Supabase Storage; set promotional badges; and monitor low-stock or out-of-stock items.
- **Category Directory**: Organize and manage store catalog categories.
- **Customer Directory**: View customer profiles, aggregated order counts, and contact records.
- **Discount & Coupon Engine**: Create percentage or fixed-amount discount codes with expiration dates and minimum order thresholds.
- **Customer Reviews & Moderation**: Review customer ratings and feedback before publication.
- **Store & Security Settings**: Update business contact information, delivery fees, minimum order values, and operational hours.
- **Two-Step Owner Security (2FA)**: Protected with master password verification plus secondary 6-digit Email OTP delivered via Nodemailer / Gmail SMTP, backed by emergency recovery keys.
- **Dual-Device UI**: Collapsible desktop sidebar with tooltips, and a mobile navigation drawer with bottom action sheets.

---

## 🤖 AI Customer Support Assistant

An embedded intelligent support widget (`Chatbot.js`) that:
- Recognizes active customer orders and provides real-time status updates.
- Answers common customer questions regarding store timings, delivery areas in Bakani, damaged item replacement policies, and bulk orders.
- Connects directly to store staff via pre-filled WhatsApp inquiry links.

---

## 📱 Progressive Web App (PWA)

- **Installable Application**: Adds directly to home screens on Android, iOS, and Desktop.
- **Offline Reliability**: Service worker (`public/sw.js`) caches critical static assets and navigation shells.
- **Web App Manifest**: Configured with official store branding, icons, theme colors, and standalone display mode (`public/manifest.json`).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | React Server Components, Turbopack, and API routes |
| **UI Library** | [React 19](https://react.dev/) | Component architecture & client-side interactivity |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Primary data persistence for products, orders, profiles, and coupons |
| **Storage** | Supabase Storage (`product-images`) | Cloud object storage for product image uploads |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Client-side reactive stores (Cart, Wishlist, Auth, UI) |
| **Styling** | Modular CSS (`src/styles/`) + [Tailwind CSS 3.4](https://tailwindcss.com/) | High-performance styling and design system |
| **Icons & Animation** | [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/) | Consistent iconography and smooth micro-interactions |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (Gmail SMTP) | Two-factor authentication (2FA) codes & order notifications |

---

## 📁 Directory Structure

```
gupta-store-nextjs/
├── database/                   # Supabase database schemas, seeds & tools
│   ├── schema.sql              # Core PostgreSQL DDL (Tables, RLS policies, indexes)
│   ├── README.md               # Database setup and configuration instructions
│   ├── seeds/                  # Seed data files
│   │   ├── products.sql        # Curated stationery catalog dataset
│   │   ├── orders.sql          # Order records
│   │   └── product-extra-data.sql # Badges, tags, and product metadata
│   └── tools/                  # Schema audit and storage migration utilities
├── docs/                       # Operational documentation
│   └── OTP_SYSTEM.md           # Unified OTP verification architecture
├── public/                     # Static assets, branding, and PWA manifest
│   ├── logo.png                # Gupta Store official logo
│   ├── manifest.json           # Web App Manifest
│   └── sw.js                   # Service Worker script
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Owner Admin Dashboard & Upload interface
│   │   ├── api/                # Backend API route handlers
│   │   │   ├── admin/          # Admin-protected endpoints (login, orders, settings)
│   │   │   ├── auth/           # Customer authentication & OTP endpoints
│   │   │   ├── cart/           # Cart operations
│   │   │   ├── orders/         # Order creation & tracking endpoints
│   │   │   └── products/       # Public catalog API
│   │   ├── auth/               # Customer Login / Registration page
│   │   ├── cart/               # Shopping cart & checkout flow
│   │   ├── orders/             # Customer order history
│   │   ├── track/              # Public live order tracking
│   │   ├── globals.css         # Clean master CSS orchestrator (13 lines)
│   │   ├── layout.js           # Root layout & Chrome wrapper
│   │   └── page.js             # Customer storefront homepage
│   ├── components/             # Reusable UI components
│   │   ├── AppChrome.js        # Global layout shell (Navbar, Ticker, Chatbot, Footer)
│   │   ├── Chatbot.js          # AI Customer Support widget
│   │   ├── Footer.js           # Global footer with trust badges
│   │   ├── Navbar.js           # Responsive header with search & cart drawer trigger
│   │   ├── ProductCard.js      # Catalog card with image fallback handling
│   │   └── MobileBottomNav.js  # Mobile bottom tab navigation
│   ├── lib/                    # Supabase client, Zustand stores & helpers
│   │   ├── config.js           # Store information constants
│   │   ├── store.js            # Zustand stores (Cart, Auth, Wishlist, UI)
│   │   ├── supabase.js         # Public Supabase client
│   │   ├── supabaseAdmin.js    # Privileged Supabase Service-Role client
│   │   └── utils.js            # Currency & date formatting utilities
│   └── styles/                 # Modular CSS architecture
│       ├── variables.css       # Design tokens, color system, elevation
│       ├── base.css            # Base resets, typography, universal buttons (.btn)
│       ├── components.css      # Header, Footer, Modals, Toasts, Ticker
│       ├── storefront.css      # Catalog grid, category pills, filter panel
│       ├── cart.css            # Cart drawer, bill summary, coupon input
│       ├── orders.css          # Order cards, delivery tracking timeline
│       ├── auth.css            # Auth shell, OTP inputs, profile page
│       ├── responsive.css      # Mobile (<640px) & tablet (<1024px) media queries
│       └── admin-legacy.css    # Isolated admin styles
├── scripts/                    # Validation & diagnostic tools
│   ├── analyze_css.cjs         # CSS bracket validator
│   ├── test_db.cjs             # Supabase database connectivity test
│   └── verify_app.cjs          # Application endpoint health check
├── .env.example                # Sanitized environment template
├── .env.local.example          # Comprehensive setup guide with comments
├── .gitignore                  # Git ignore rules
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies & scripts
└── tailwind.config.js          # Tailwind CSS configuration
```

---

## 🎨 CSS Architecture & Performance

The styling system is split into **domain-specific modular stylesheets** under `src/styles/` to reduce CSSOM construction time and eliminate style bloat:

- **`variables.css`**: Design tokens, brand colors (Navy `#0f172a`, Orange `#f97316`), and font hierarchies.
- **`base.css`**: CSS resets, hardware acceleration (`translateZ(0)`), typography, and the **Universal Button System** (`.btn`, `.btn-orange`, `.btn-load-more`, `.btn-navy`, `.btn-ghost`).
- **`components.css`**: Header/Navbar, Ticker, Mobile Bottom Nav, Modals, and Footer.
- **`storefront.css`**: Hero banner, Category chips, Filter sidebar, Product cards, and List View items.
- **`cart.css`**: Slide-out cart drawer, item counters, bill summary breakdown, and address selectors.
- **`orders.css`**: Order status chips, tracking timeline, and action buttons.
- **`auth.css`**: Auth cards, OTP input fields, and profile settings.
- **`responsive.css`**: Mobile & tablet media queries engineered to prevent horizontal scrolling (0px overflow).
- **`admin-legacy.css`**: Admin tables, drawers, and form controls isolated from the customer storefront.

---

## 🗄️ Database & Supabase Setup

The application uses **Supabase** as its unified relational database and asset storage backend.

### 1. Database Tables (`database/schema.sql`)
- `profiles`: Customer accounts linked to Supabase Auth.
- `products`: Catalog items with pricing, MRP, stock, categories, and image URLs.
- `orders`: Order fulfillment records containing line items, customer details, and live status.
- `categories`, `coupons`, `reviews`, `inquiries`: Relational management tables.

### 2. Quick Setup Steps
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `database/schema.sql` and click **Run**.
4. (Optional) Run `database/seeds/products.sql` to populate sample stationery products.
5. In your Supabase dashboard under **Storage**, create a public bucket named `product-images`.
6. Copy your project URL, anon key, and service role key into `.env.local`.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your actual credentials in `.env.local`:

```env
# ── SUPABASE (Database, Auth, Storage) ────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ── OWNER ADMIN PORTAL SECURITY ───────────────────────────────
ADMIN_PASSWORD=your_secure_admin_password_here
ADMIN_SECRET=your_admin_session_secret_hex_or_string
ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_BACKUP_KEY=123456

# ── EMAIL NOTIFICATIONS & OTP (Nodemailer / Gmail SMTP) ───────
EMAIL_USER=your_store_email@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
EMAIL_FROM="Gupta General Store <your_store_email@gmail.com>"

# ── STORE INFORMATION & BRANDING ──────────────────────────────
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

3. **Configure Environment:**
   Set up your `.env.local` with Supabase and Admin credentials.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `next dev` | Starts development server with Turbopack hot reloading |
| **`npm run build`** | `next build` | Generates optimized production build & prerenders static pages |
| **`npm start`** | `next start` | Runs the compiled Next.js production server |
| **`node scripts/test_db.cjs`** | `node scripts/...` | Tests live Supabase database connectivity |
| **`node scripts/analyze_css.cjs`** | `node scripts/...` | Verifies syntax and bracket balance across all modular stylesheets |

---

## 📄 License & Acknowledgements

- **Proprietary Software**: Developed specifically for **Gupta General Store**, Bakani, Rajasthan.
- **Copyright**: © 2026 Gupta General Store. All rights reserved.
- **Crafted with**: Next.js, React, Supabase, Tailwind CSS, and Lucide Icons.
