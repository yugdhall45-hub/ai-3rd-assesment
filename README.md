# Local Business Billing, Daybook & Financial Reporting Platform

A modern, fast, full-stack **POS Billing**, **Daily Expense & Income Tracker**, **Cash Register Daybook**, **Customer Khata (Udhar) Ledger**, and **Financial Reporting** web application designed specifically for local businesses.

---

## 🌟 Key Features

1. **Point of Sale (POS) & Billing** — Instant checkout, thermal receipt & A4 invoice printing, multi-payment modes (Cash, UPI, Card, Khata/Credit)
2. **Daily Expenses & Other Income** — Log overheads (Tea, Utilities, Rent, Wages, Inventory) and miscellaneous income (Scrap sales, commissions)
3. **Daybook & Cash Drawer Reconciliation** — Browse any date's full ledger, calculate expected vs actual drawer cash
4. **Customer Khata (Udhar) Ledger** — Track outstanding dues, record repayments, auto-settle oldest invoices
5. **Inventory & Product Catalog** — Cost/selling price, stock tracking with low-stock alerts
6. **Reports & P&L Analytics** — Profit & Loss, expense breakdown, payment mode distribution, top products, CSV export

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + Lucide Icons |
| Database | PostgreSQL via **Neon** (serverless) |
| ORM | Prisma ORM |
| Deployment | Vercel |

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yugdhall45-hub/ai-3rd-assesment.git
cd ai-3rd-assesment
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create a Free Neon PostgreSQL Database
1. Go to [neon.tech](https://neon.tech) and sign up for free
2. Create a new project → note your **Connection Strings**
3. In your Neon Dashboard → **Connection Details** → copy both:
   - **Pooled connection string** (for `DATABASE_URL`)
   - **Direct connection string** (for `DIRECT_URL`)

### 4. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in your Neon credentials:
```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 5. Push Database Schema
```bash
npm run db:push
```

### 6. (Optional) Seed Sample Data
```bash
npm run db:seed
```

### 7. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Vercel Deployment Guide

### Step 1: Push to GitHub (already done)
```bash
git push origin main
```

### Step 2: Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo `yugdhall45-hub/ai-3rd-assesment`
3. Framework: **Next.js** (auto-detected)

### Step 3: Set Environment Variables on Vercel
In your Vercel project → **Settings** → **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | Your Neon **pooled** connection string |
| `DIRECT_URL` | Your Neon **direct** connection string |

### Step 4: Deploy
Click **Deploy**. Vercel will auto-run `npm install` → `prisma generate` → `next build`.

### Step 5: Initialize Database (First Deploy)
After deployment, run this once to create tables in Neon:
```bash
# From your local machine (with .env set up):
npm run db:push

# To populate sample data:
npm run db:seed
```

---

## 📂 Project Structure

```text
├── app/
│   ├── page.tsx              # Dashboard (KPIs, Quick Actions)
│   ├── billing/page.tsx      # POS Billing & Invoice Printing
│   ├── customers/page.tsx    # Customer Khata & Dues
│   ├── daybook/page.tsx      # Cash Register & Daily Ledger
│   ├── expenses/page.tsx     # Daily Expenses & Other Income
│   ├── inventory/page.tsx    # Product Catalog & Stock
│   ├── reports/page.tsx      # P&L Reports & CSV Export
│   ├── settings/page.tsx     # Store Profile & Settings
│   ├── layout.tsx            # App Layout (Sidebar + Navbar)
│   └── globals.css           # Global Styles & Print Rules
├── components/
│   ├── Sidebar.tsx           # Navigation Sidebar
│   └── Navbar.tsx            # Header with Quick Actions
├── lib/
│   ├── actions.ts            # Server Actions & Business Logic
│   ├── prisma.ts             # Prisma Client Singleton
│   └── types.ts              # TypeScript Interfaces
├── prisma/
│   ├── schema.prisma         # Database Models (PostgreSQL)
│   └── seed.ts               # Sample Data Seeder
├── vercel.json               # Vercel Deployment Config
├── .env.example              # Environment Variables Template
└── README.md
```

---

## 📄 License
MIT License
