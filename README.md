# Local Business Billing, Daybook & Financial Reporting Platform

A modern, fast, full-stack POS Billing, Daily Expense & Income Tracker, Cash Register Daybook, Customer Khata (Udhar) Ledger, and Financial Reporting web application designed specifically for local businesses (retail stores, grocery shops, cafes, repair services, and distributors).

---

## 🌟 Key Features

1. **Point of Sale (POS) & Billing**
   - Instant product search by name or barcode/SKU with quantity steppers.
   - Walk-in customer or registered customer selector with quick-create modal.
   - Custom line items support for loose or unlisted items.
   - Multi-payment support: Cash, UPI / QR, Card, and Credit (Khata / Udhar).
   - Instant calculation of subtotal, discounts, tax, and change returned.
   - **Dual Print Modes**:
     - **80mm Thermal Receipt**: Formatted for POS receipt printers.
     - **Standard A4 Invoice**: Formal tax invoice for wholesale/corporate clients.
   - Previous bills history with one-click due collection and re-printing.

2. **Daily Expenses & Other Income Tracker**
   - Quick logging of daily business overheads (Staff Tea/Snacks, Electricity & Utilities, Rent, Staff Wages, Inventory, Maintenance, Transport).
   - Miscellaneous income logging (Cardboard scrap sales, courier commissions, service fees).
   - Categorization and payment mode tagging (Cash, UPI, Card, Bank).

3. **Daybook Register & Cash Drawer Reconciliation**
   - Date stepper (`Prev`, `Today`, `Next`, or calendar picker) to audit any date.
   - Cash register equation: Opening Cash + Cash Inflows − Cash Expenses = Expected Drawer Cash.
   - Physical cash count reconciliation with immediate shortage / excess alerts.
   - Unified chronological daily transaction activity stream.
   - One-click Daybook CSV export and printable audit format.

4. **Customers & Khata (Udhar) Management**
   - Customer directory tracking outstanding dues.
   - Live status badges (`Pending Khata` vs `All Clear`).
   - Settle debts with partial or full repayment, automatically updating invoices and logging cash inflow into today's daybook.

5. **Inventory & Product Master**
   - SKU, category, cost price, selling price, and stock levels.
   - Profit margin calculations per product.
   - Low-stock warning badges (triggered when stock $\le$ 10).
   - Inventory valuation: Total Wholesale Cost vs Total Retail Revenue Potential.

6. **Comprehensive Financial Reports & Analytics**
   - **Profit & Loss (P&L)**: Date range filter (Today, 7 Days, Month, Year, Custom Range) calculating Total Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Profit Margin.
   - **Category Expense Breakdown**: Visual percentage bars and totals.
   - **Sales by Payment Method**: Distribution of Cash vs UPI vs Card vs Credit.
   - **Top Selling Products**: Ranked by quantity sold and revenue generated.
   - **Export to CSV / Excel**: One-click download for accounting.

7. **Store Profile & Customization**
   - Store Name, Tagline, Phone, Email, Address, GSTIN / Tax ID.
   - Configurable currency symbol (`₹`, `$`, `€`, `£`, `AED`, etc.).
   - Default tax percentage.
   - Receipt header and footer note customization.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Printing**: Native CSS `@media print` with optimized layouts for 80mm thermal receipts and A4 invoices.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.17 or higher)
- npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yugdhall45-hub/ai-3rd-assesment.git
cd ai-3rd-assesment

# Install dependencies
npm install

# Initialize SQLite database and Prisma client
npx prisma db push

# (Optional) Seed sample data
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── app/
│   ├── billing/page.tsx      # POS Billing & Receipt/Invoice Printing
│   ├── customers/page.tsx    # Customer Khata & Credit Accounts
│   ├── daybook/page.tsx      # Daily Records, Cash Register & Ledger
│   ├── expenses/page.tsx     # Daily Expenses & Income Tracker
│   ├── inventory/page.tsx    # Product Master & Stock Valuation
│   ├── reports/page.tsx      # Profit & Loss, Trends & CSV Export
│   ├── settings/page.tsx     # Store Profile, Currency & Print Config
│   ├── layout.tsx            # Global Layout with responsive Sidebar & Navbar
│   ├── page.tsx              # Main Dashboard with KPI metrics & Activity
│   └── globals.css           # Styling & Print Media Rules
├── components/
│   ├── Sidebar.tsx           # Navigation Sidebar
│   └── Navbar.tsx            # Header with Date and Quick Actions
├── lib/
│   ├── actions.ts            # Server Actions & Business Logic
│   ├── prisma.ts             # Prisma Singleton Client
│   └── types.ts              # Shared TypeScript Interfaces
└── prisma/
    ├── schema.prisma         # Database Models
    └── seed.ts               # Sample Business Data Seeder
```

---

## 📄 License
MIT License

