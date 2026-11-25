# Gupta General Store — Database Setup (Supabase)

This directory contains the database schema, security policies (Row Level Security), and initial seed data for the Gupta General Store project.

## 📁 Structure

- `schema.sql`: Complete DDL creating all required tables (`profiles`, `products`, `orders`, `categories`, `coupons`, `reviews`, `offers`, `notifications`, `inquiries`), indexes, and RLS policies.
- `seeds/products.sql`: Seed data for the initial product catalog (50+ stationery items across pens, notebooks, art supplies, and accessories).
- `seeds/orders.sql`: Seed data for initial order records.
- `seeds/product-extra-data.sql`: Additional product metadata, badges, and attributes.
- `tools/`: Utility scripts for product sync, storage checking, and schema verification.

## 🚀 Setting Up on Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `database/schema.sql` and click **Run**.
4. (Optional) Run `database/seeds/products.sql` to populate the catalog with demo items.
5. In your Supabase dashboard under **Storage**, create a public bucket named `product-images`.
6. Copy your project URL and `anon` / `service_role` keys into your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
