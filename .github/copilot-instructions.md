# Copilot Instructions — Royal Gems & Jewellers

## Project Overview
This is a **Jewellery Management System** (React SPA) for the Sri Lankan retail jewellery market. It handles inventory, sales invoicing, supplier purchases (GRN), repair job tracking, gold loan pawning with precise interest calculations, and business reporting.

**Business:** Royal Gems & Jewellers | **Currency:** Sri Lankan Rupees (Rs.) | **Language:** English

---

## Tech Stack
- **React 19.2.0** with React Compiler enabled (babel-plugin-react-compiler)
- **TypeScript 5.9.3** in strict mode
- **Vite 7.2.4** — build tool with manual chunk splitting
- **React Router DOM 7.11.0** — client-side SPA routing
- **Tailwind CSS 3.4.17** — utility-first styling with dark mode (`dark:` prefix)
- **Lucide React** — icon library
- **Radix UI** — accessible select primitives
- **clsx + tailwind-merge** — class name composition via `cn()` utility
- **npm** — package manager

---

## Project Structure

```
src/
├── main.tsx                    # Entry — StrictMode + BrowserRouter + ThemeProvider
├── App.tsx                     # All 20+ routes defined here
├── index.css                   # Tailwind directives
├── types/index.ts              # Complete type system (600+ lines)
├── utils/
│   ├── cn.ts                   # cn() = clsx + tailwind-merge
│   ├── formatters.ts           # 18 formatting functions (currency, date, weight, etc.)
│   └── pawnCalculations.ts     # 15+ pawn interest calculation functions
├── contexts/ThemeContext.tsx    # Dark/Light/System theme provider
├── data/
│   ├── mockData.ts             # 50+ mock records (all business entities)
│   └── sampleData.ts           # Sample data structures
├── components/
│   ├── Layout.tsx              # Sidebar nav with collapsible submenus + theme toggle
│   ├── Printable*.tsx          # 6 print templates (A5 & 80mm thermal)
│   └── ui/                     # 12 reusable UI components (Button, Card, Table, Modal, etc.)
└── pages/                      # 18 page components
```

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
- Currently **client-side only** with mock data in `src/data/mockData.ts`
- Print data flows via `localStorage` → fallback to mockData
- No backend API — all data is mocked
- State management: React hooks only (no Redux, Zustand, etc.)

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
- `Supplier`: id, companyName, contactPerson, paymentTerms, bankDetails
- `Invoice`: invoiceNumber, customerId, items[], totals, status, payment info
- `GRN`: grnNumber, supplierId, items[], quality check, totals
- `RepairJob`: jobNumber, 9-stage workflow status, items[], estimate, priority
- `PawnTicket`: ticketNumber, customerNIC, items[], principal, interest rate, maturity date

### Pawning (Most Complex Module)
- `InterestCalculation`: standard interest (5% per month default)
- `PreciseInterestCalculation`: time-precise down to minutes
- `InterestPayment`: partial interest payment records
- `PawnRedemption`: full settlement with interest breakdown

---

## Routing (src/App.tsx)

Key route patterns:
- List pages: `/invoices`, `/pawning`, `/repairs`, `/grn`
- Create pages: `/invoices/create`, `/pawning/create`, `/repairs/create`
- Print pages: `/invoices/:id/print`, `/pawning/:id/print` (bypass Layout, auto-trigger print)
- Action pages: `/pawning/:id/redeem`, `/pawning/:ticketId/pay-interest`

---

## Print System
- 6 printable components render as A5 (148×210mm) or 80mm thermal format
- Print routes bypass sidebar layout
- `window.print()` triggered on component mount
- CSS `@media print` rules with 6mm margins, color preservation

---

## Build & Deployment

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build → dist/
npm run preview      # Preview production build locally
```

**Deployed on Render.com** as a static site (see `render.yaml`):
- Build: `npm install && npm run build`
- Publish: `./dist`
- SPA rewrite: `/*` → `/index.html`

---

## Vite Code Splitting (vite.config.ts)

Manual chunks configured:
- `vendor-react`: react, react-dom, react-router
- `vendor-icons`: lucide-react
- `pages-pawning`, `pages-repairs`, `pages-invoices`, `pages-grn`, `pages-misc`
- `printables`: all PrintableXxx components
