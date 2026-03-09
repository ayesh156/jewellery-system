# Copilot Instructions — Onelka Jewellery

## Project Overview
This is a **Jewellery Management System** (React SPA) for the Sri Lankan retail jewellery market. It handles inventory, sales invoicing, clearance sales, and business reporting.

**Business:** Onelka Jewellery | **Currency:** Sri Lankan Rupees (Rs.) | **Language:** English

---

## Tech Stack

### Frontend
- **React 19.2.0** with React Compiler enabled (babel-plugin-react-compiler)
- **TypeScript 5.9.3** in strict mode
- **Vite 7.2.4** — build tool with manual chunk splitting
- **React Router DOM 7.11.0** — client-side SPA routing
- **Tailwind CSS 3.4.17** — utility-first styling with dark mode (`dark:` prefix)
- **Lucide React** — icon library
- **Radix UI** — accessible select primitives
- **clsx + tailwind-merge** — class name composition via `cn()` utility
- **react-hot-toast** — toast notifications
- **jsPDF** — PDF report generation (ink-optimized B&W layout)

### Backend
- **Node.js + Express.js** — REST API
- **TypeScript** in strict mode
- **Drizzle ORM** — lightweight TypeScript-native ORM
- **Neon PostgreSQL** — serverless Postgres database
- **Zod** — request validation
- **npm** — package manager

---

## Project Structure (Monorepo)

```
├── frontend/                   # React SPA (Vite)
│   ├── src/
│   │   ├── main.tsx            # Entry — StrictMode + BrowserRouter + ThemeProvider
│   │   ├── App.tsx             # All routes defined here
│   │   ├── index.css           # Tailwind directives
│   │   ├── types/index.ts      # Complete type system
│   │   ├── utils/
│   │   │   ├── cn.ts           # cn() = clsx + tailwind-merge
│   │   │   ├── formatters.ts   # Formatting functions (currency, date, weight, etc.)
│   │   │   ├── reportPdf.ts    # jsPDF report generator (ink-optimized B&W)
│   │   │   └── pawnCalculations.ts  # Pawn interest calculations (kept for future)
│   │   ├── contexts/ThemeContext.tsx # Dark/Light/System theme provider
│   │   ├── data/
│   │   │   ├── mockData.ts     # Mock records (kept for reference)
│   │   │   └── sampleData.ts   # Sample data structures
│   │   ├── services/
│   │   │   └── api.ts          # API service (invoiceApi, clearanceApi, etc.)
│   │   ├── components/
│   │   │   ├── Layout.tsx      # Sidebar nav with collapsible submenus + theme toggle
│   │   │   ├── PrintableInvoice.tsx    # Invoice print template
│   │   │   ├── PrintableClearance.tsx  # Clearance sale print template
│   │   │   ├── Printable*.tsx  # Other print templates (kept for future)
│   │   │   └── ui/            # Reusable UI components (Button, Card, Table, Modal, etc.)
│   │   └── pages/             # Page components
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── tsconfig.json
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts            # Express server entry point
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle ORM schema (all tables)
│   │   │   └── index.ts        # Neon DB connection
│   │   ├── routes/
│   │   │   ├── categories.ts   # CRUD /api/categories
│   │   │   ├── products.ts     # CRUD /api/products (search, pagination)
│   │   │   ├── gold.ts         # /api/gold/rates, /api/gold/types
│   │   │   ├── company.ts      # /api/company (single-row config)
│   │   │   ├── customers.ts    # CRUD /api/customers
│   │   │   ├── invoices.ts     # CRUD /api/invoices
│   │   │   └── clearance.ts    # CRUD /api/clearance
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # AppError class + error middleware
│   │   └── seed/
│   │       ├── data.ts         # All seed data (categories, products, clearances, etc.)
│   │       └── index.ts        # Seed runner script
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── .env.example
└── README.md
```

---

## Active Modules

### Currently Active
- **Dashboard** — Real-time API-driven overview: revenue stats, today/month sales, collection rate, recent invoices, recent clearances, inventory by category, top customers, outstanding balances, total inventory value
- **Products** — Inventory management with search, pagination
- **Customers** — Customer CRUD with types (retail/wholesale/vip/credit), credit management
- **Sales (Invoices)** — Full invoice lifecycle (create/edit/print/payments)
- **Clearance Sales** — Discounted sales with clearance reason tracking
- **Categories** — Product category management
- **Gold Types** — Gold karat configuration & rates
- **Reports** — Business reporting with period selection (daily/custom/monthly/yearly), jsPDF PDF download
- **Settings** — Company info, numbering, user profile, appearance (horizontal tab layout)

### Removed from UI (files kept for future)
- **Pawning** — pages: `Pawning.tsx`, `CreatePawnTicket.tsx`, `RedeemPawnTicket.tsx`, `PayInterest.tsx`; components: `PrintablePawnTicket.tsx`, `PrintableRedemptionReceipt.tsx`, `PrintableInterestReceipt.tsx`; utils: `pawnCalculations.ts`
- **Repairs** — pages: `RepairJobs.tsx`, `CreateRepairJob.tsx`; components: `PrintableRepairReceipt.tsx`
- **GRN (Goods Received Notes)** — pages: `GRN.tsx`, `CreateGRN.tsx`; components: `PrintableGRN.tsx`
- **Suppliers** — pages: `Suppliers.tsx`
- None of the above have routes in `App.tsx` or sidebar entries in `Layout.tsx`

---

## Coding Conventions

### General Rules
- Always use **TypeScript** with explicit types — strict mode is enabled
- Use **Tailwind CSS classes only** — no custom CSS files or inline styles
- Use **`cn()`** from `@/utils/cn` for conditional class composition
- Import icons from **`lucide-react`** only
- Use **functional components** with React hooks (useState, useMemo, useCallback, useEffect)
- Use **`@/`** path alias for all imports (maps to `./src/`)
- All new routes must be added to **`src/App.tsx`**

### Component Patterns
- UI components live in `src/components/ui/` — reuse them, don't create duplicates
- Page components go in `src/pages/`
- Export new components from their respective `index.ts` barrel files
- Tables must support both desktop (Table) and mobile (MobileCard) views
- Use `Badge` component for status indicators with appropriate variants

### Styling
- Dark mode: use `dark:` prefix classes (Tailwind dark mode via class strategy)
- Color tokens use HSL CSS variables: `hsl(var(--primary))`, `hsl(var(--background))`, etc.
- Amber/Gold accent colors for jewellery branding
- Responsive: mobile-first approach, sidebar collapses on mobile

### Data & State
- **Backend API** for all data (invoices, clearances, products, customers, etc.)
- **API returns numeric fields as strings** — always wrap with `Number()` before arithmetic (e.g., `Number(invoice.total)`)
- Print data flows via `localStorage` → API fallback
- State management: React hooks only (no Redux, Zustand, etc.)
- API service in `src/services/api.ts` — all API calls go through this

### Formatting
- Currency: use `formatCurrency()` → `Rs. 50,000.00`
- Dates: use `formatDate()` → `05 Mar 2024`
- Weight: use `formatWeight()` → `45.500 g`
- Phone: use `formatPhone()` → `+94 77 234 5678`
- All formatters are in `src/utils/formatters.ts`

---

## Key Types (src/types/index.ts)

### Metals & Products
- `MetalType`: gold | silver | platinum | palladium | white-gold | rose-gold
- `GoldKarat`: 24K | 22K | 21K | 18K | 14K | 10K | 9K
- `JewelleryItem`: SKU, barcode, categoryId, metalType, karat, metalWeight, prices, stock

### Business Entities
- `Customer`: id, name, phone, customerType (retail/wholesale/vip/credit), creditLimit
- `Invoice`: invoiceNumber, customerId, items[], totals, status, payment info
- `Clearance`: clearanceNumber, customerId, clearanceReason, items[], totals, status

### Shared Types
- `InvoiceItem` — used by both Invoice and Clearance items
- `InvoiceStatus`: draft | pending | partial | paid | cancelled | overdue
- `PaymentMethod`: cash | card | bank-transfer | cheque | credit | mobile-payment

---

## Routing (src/App.tsx)

### Print routes (no Layout wrapper)
- `/invoices/:id/print` — Invoice print
- `/clearance/:id/print` — Clearance print

### Main routes (inside Layout)
- `/dashboard` — Dashboard
- `/products` — Products list
- `/customers` — Customers list
- `/invoices` — Invoice list
- `/invoices/create` — Create invoice
- `/invoices/:id/edit` — Edit invoice
- `/clearance` — Clearance list
- `/clearance/create` — Create clearance
- `/clearance/:id/edit` — Edit clearance
- `/categories` — Categories
- `/gold-types` — Gold types & rates
- `/reports` — Reports
- `/settings` — Settings (tabs: Company, Numbering, User Profile, Appearance)

---

## Print System
- Print templates render as A5 format with print-specific CSS
- Print routes bypass sidebar layout
- `window.print()` triggered on component mount
- CSS `@media print` rules with 6mm margins, color preservation
- Data passed via `localStorage`, with API fallback

---

## Counter / Numbering System
- Each entity type has auto-increment counters per shop code
- Default prefixes: invoice=INV, clearance=CLR, product=PROD, category=CAT, customer=CUS
- ID format: `{shopCode}-{prefix}-{paddedNumber}` (e.g., `a-inv-0001`)
- Shop codes: 1-3 uppercase letters (A, B, HQ, etc.)
- Managed in Settings → Numbering tab

---

## Settings Page
- **Horizontal tab bar** layout (not sidebar) with 4 tabs:
  - Company — business info, logo, billing defaults
  - Numbering — shop code & sequence number management
  - User Profile — name, email, role, password
  - Appearance — theme (light/dark/system), accent color, font size
- Save button in page header
- Full-width content area, 2-column grid on desktop, responsive on mobile

---

## Build & Deployment

### Frontend
```bash
cd frontend
npm install          # Install dependencies (uses pnpm-lock.yaml)
npm run dev          # Dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build → dist/
npm run preview      # Preview production build locally
```

**Deployed on Vercel** as a static site (see `frontend/vercel.json`):
- Root Directory: `frontend` (set in Vercel dashboard)
- Build: `npm install && npm run build`
- Output: `dist/`
- SPA rewrite: `/*` → `/index.html`

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000 (tsx watch)
npm run build        # TypeScript compile → dist/
npm run db:push      # Push schema to Neon DB
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Drizzle Studio GUI
```

**Database:** Neon PostgreSQL (neon.tech) — connection via `DATABASE_URL` env var
**API Base:** `http://localhost:3000/api`

### Seed Data (backend/src/seed/data.ts)
The seed script (`npm run db:seed`) populates the database with:
- 1 company info record (Onelka Jewellery)
- 14 jewellery categories (Necklaces, Earrings, Rings, Bangles, etc.)
- 7 gold type configurations (24K–9K with purity & wastage %)
- 7 gold rates (buying/selling per gram in LKR)
- 10 jewellery products with pricing & stock
- 4 gemstone records linked to products
- 5 customers (1 VIP, 2 retail, 1 wholesale, 1 credit)
- 3 invoices with 5 line items and 2 payment records
- 7 clearance sales with 8 line items and 6 payment records
- 5 counter sequences (shop code 'M')

---

## Database Schema (backend/src/db/schema.ts)

### Tables
- `companyInfo` — single-row company configuration
- `categories` — product categories
- `goldTypeConfigs` — gold karat configurations
- `goldRates` — daily gold rates per karat
- `products` — jewellery inventory
- `productGemstones` — gemstone details for products
- `customers` — customer records
- `invoices` — sales invoices
- `invoiceItems` — invoice line items
- `payments` — invoice payments
- `clearances` — clearance sales (has `clearanceReason` field)
- `clearanceItems` — clearance line items
- `clearancePayments` — clearance payments
- `counters` — auto-increment sequences per shop

---

## Vite Code Splitting (vite.config.ts)

Manual chunks configured:
- `vendor-react`: react, react-dom, react-router
- `vendor-icons`: lucide-react
- `pages-invoices`: Invoice & Sales pages
- `pages-pawning`, `pages-repairs`, `pages-grn`: kept for future modules
- `pages-misc`: all other pages (including Clearance)
- `printables`: all PrintableXxx components
- `mock-data`: data files
