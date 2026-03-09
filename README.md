# Onelka Jewellery Management System

A full-stack **Jewellery Management System** built for the Sri Lankan retail jewellery market. Handles inventory, sales invoicing, clearance sales, and business reporting.

**Business:** Onelka Jewellery | **Currency:** Sri Lankan Rupees (Rs.) | **Language:** English

---

## Tech Stack

| Layer    | Technologies |
|----------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide Icons, jsPDF |
| Backend  | Node.js, Express, TypeScript, Drizzle ORM, Zod |
| Database | Neon PostgreSQL (serverless) |
| Deploy   | Vercel (frontend), Neon (database) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Neon PostgreSQL database (or any Postgres)

### Backend Setup
```bash
cd backend
cp .env.example .env       # Add your DATABASE_URL
npm install
npm run db:push            # Create tables in Neon DB
npm run db:seed            # Seed with sample data
npm run dev                # Start API at http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                # Start dev server at http://localhost:5173
```

### Build for Production
```bash
cd frontend
npm run build              # TypeScript check + Vite build → dist/
npm run preview            # Preview production build locally
```

---

## Active Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time API-driven overview: revenue stats, today/month sales, collection rate, recent invoices, recent clearances, inventory by category, top customers, outstanding balances |
| **Products** | Inventory management with search, pagination, stock tracking |
| **Customers** | CRUD with types (retail/wholesale/vip/credit), credit management |
| **Sales (Invoices)** | Full invoice lifecycle — create, edit, print, record payments |
| **Clearance Sales** | Discounted sales with clearance reason tracking |
| **Categories** | Product category management |
| **Gold Types** | Gold karat configuration & daily rates |
| **Reports** | Business reporting with period selection (daily/custom/monthly/yearly), PDF download |
| **Settings** | Company info, numbering, user profile, appearance |

---

## Hidden Modules (Files Kept for Future Use)

The following modules have been **removed from the UI** (no routes in `App.tsx`, no sidebar entries in `Layout.tsx`) but all source files are retained in the codebase for future re-activation:

### Pawning Module
Pawn ticket lifecycle for gold jewellery pawning.
- **Pages:** `Pawning.tsx` (list), `CreatePawnTicket.tsx`, `RedeemPawnTicket.tsx`, `PayInterest.tsx`
- **Print Templates:** `PrintablePawnTicket.tsx`, `PrintableRedemptionReceipt.tsx`, `PrintableInterestReceipt.tsx`
- **Utils:** `pawnCalculations.ts` (interest calculation logic)

### Repairs Module
Repair job tracking for jewellery repair services.
- **Pages:** `RepairJobs.tsx` (list), `CreateRepairJob.tsx`
- **Print Templates:** `PrintableRepairReceipt.tsx`

### GRN (Goods Received Notes) Module
Goods receiving from suppliers for inventory restocking.
- **Pages:** `GRN.tsx` (list), `CreateGRN.tsx`
- **Print Templates:** `PrintableGRN.tsx`

### Suppliers Module
Supplier management for procurement.
- **Pages:** `Suppliers.tsx`

> **To re-activate a module:** Add routes in `App.tsx`, add sidebar entry in `Layout.tsx`, and ensure backend routes exist if needed.

---

## Seed Data

Running `npm run db:seed` in the backend populates the database with:

| Entity | Count | Details |
|--------|-------|---------|
| Company Info | 1 | Onelka Jewellery |
| Categories | 14 | Necklaces, Earrings, Rings, Bangles, Pendants, Chains, etc. |
| Gold Types | 7 | 24K–9K with purity & wastage percentages |
| Gold Rates | 7 | Buying/selling rates per gram in LKR |
| Products | 10 | Jewellery items with pricing & stock |
| Gemstones | 4 | Linked to diamond/ruby products |
| Customers | 5 | 1 VIP, 2 retail, 1 wholesale, 1 credit |
| Invoices | 3 | With 5 line items & 2 payments |
| Clearances | 7 | With 8 line items & 6 payments |
| Counters | 5 | Auto-increment sequences (shop code 'M') |

---

## Deployment (Vercel)

The frontend is deployed as a static site on **Vercel**:

- **Root Directory:** `frontend` (set in Vercel dashboard)
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist/`
- **SPA Rewrite:** `/*` → `/index.html`
- **Config:** See `frontend/vercel.json`

---

## Project Structure

```
├── frontend/                   # React SPA (Vite)
│   ├── src/
│   │   ├── main.tsx            # Entry — StrictMode + BrowserRouter + ThemeProvider
│   │   ├── App.tsx             # All routes defined here
│   │   ├── index.css           # Tailwind directives
│   │   ├── types/index.ts      # Complete type system
│   │   ├── utils/              # cn, formatters, reportPdf, pawnCalculations
│   │   ├── contexts/           # ThemeContext (dark/light/system)
│   │   ├── services/api.ts     # API service layer
│   │   ├── components/         # Layout, Printables, ui/
│   │   └── pages/              # All page components
│   ├── vercel.json
│   └── vite.config.ts
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts            # Express entry point
│   │   ├── db/                 # Drizzle schema & connection
│   │   ├── routes/             # API route handlers
│   │   ├── middleware/         # Error handler
│   │   └── seed/               # Seed data & runner
│   └── drizzle.config.ts
└── README.md
```
