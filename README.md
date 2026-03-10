# Onelka Jewellery Management System

A full-stack **Jewellery Management System** built for the Sri Lankan retail jewellery market. Handles inventory, sales invoicing, clearance sales, and business reporting with full authentication & user management.

**Business:** Onelka Jewellery | **Currency:** Sri Lankan Rupees (Rs.) | **Language:** English

---

## Tech Stack

| Layer    | Technologies |
|----------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide Icons, jsPDF |
| Backend  | Node.js, Express, TypeScript, Drizzle ORM, Zod, bcrypt, JWT |
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
cp .env.example .env       # Add your DATABASE_URL and JWT_SECRET
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

### Default Login Credentials
| Username | Password | Role | Shop |
|----------|----------|------|------|
| onelka1  | onelka123 | admin | M |
| onelka2  | onelka123 | admin | T |
| onelka3  | onelka123 | admin | D |

### Build for Production
```bash
cd frontend
npm run build              # TypeScript check + Vite build → dist/
npm run preview            # Preview production build locally
```

---

## Authentication

- JWT-based authentication with `AuthContext` provider
- Login via `/login` → `POST /api/auth/login` → JWT token stored in localStorage
- `PrivateRoute` wrapper protects all routes; `LoginRoute` redirects if already authenticated
- Roles: `admin` (full access + user management) and `sales` (standard access)

---

## Active Modules

| Module | Description |
|--------|-------------|
| **Login** | JWT authentication with username/password |
| **Dashboard** | Real-time API-driven overview: revenue stats, today/month sales, collection rate, recent invoices, recent clearances, inventory by category, top customers, outstanding balances |
| **Products** | Inventory management with search, pagination, stock tracking |
| **Customers** | CRUD with types (retail/wholesale/vip/credit), credit management, pay outstanding credit |
| **Sales (Invoices)** | Full invoice lifecycle — create, edit, print, record payments |
| **Clearance Sales** | Discounted sales with clearance reason tracking |
| **Categories** | Product category management |
| **Gold Types** | Gold karat configuration & daily rates |
| **Reports** | Business reporting with period selection (daily/custom/monthly/yearly), PDF download |
| **Settings** | Company info, terms & conditions, numbering, users (admin), profile, appearance |

---

## Terms & Conditions

- Managed in **Settings → Company** tab with dynamic add/remove fields and live preview
- Separate terms for **Invoices** and **Clearance Sales**
- Stored in database as newline-separated text (`invoice_terms`, `clearance_terms`)
- Loaded dynamically into print templates (fallback to hardcoded defaults if none set)
- Rendered as bullet-point unordered list on printed documents

---

## Hidden Modules (Files Kept for Future Use)

The following modules have been **removed from the UI** (no routes in `App.tsx`, no sidebar entries in `Layout.tsx`) but all source files are retained in the codebase for future re-activation:

### Pawning Module
- **Pages:** `Pawning.tsx`, `CreatePawnTicket.tsx`, `RedeemPawnTicket.tsx`, `PayInterest.tsx`
- **Print Templates:** `PrintablePawnTicket.tsx`, `PrintableRedemptionReceipt.tsx`, `PrintableInterestReceipt.tsx`
- **Utils:** `pawnCalculations.ts`

### Repairs Module
- **Pages:** `RepairJobs.tsx`, `CreateRepairJob.tsx`
- **Print Templates:** `PrintableRepairReceipt.tsx`

### GRN (Goods Received Notes) Module
- **Pages:** `GRN.tsx`, `CreateGRN.tsx`
- **Print Templates:** `PrintableGRN.tsx`

### Suppliers Module
- **Pages:** `Suppliers.tsx`

> **To re-activate a module:** Add routes in `App.tsx`, add sidebar entry in `Layout.tsx`, and ensure backend routes exist if needed.

---

## Seed Data

Running `npm run db:seed` in the backend populates the database with:

| Entity | Count | Details |
|--------|-------|---------|
| Company Info | 1 | Onelka Jewellery (with invoice & clearance terms) |
| Categories | 14 | Necklaces, Earrings, Rings, Bangles, Pendants, Chains, etc. |
| Gold Types | 7 | 24K–9K with purity & wastage percentages |
| Gold Rates | 7 | Buying/selling rates per gram in LKR |
| Products | 10 | Jewellery items with pricing & stock |
| Gemstones | 4 | Linked to diamond/ruby products |
| Customers | 5 | 1 VIP, 2 retail, 1 wholesale, 1 credit |
| Invoices | 3 | With 5 line items & 2 payments |
| Clearances | 7 | With 8 line items & 6 payments |
| Counters | 15 | Auto-increment sequences (shop codes M, T, D) |
| Users | 3 | Admin accounts for shops M, T, D |

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user info
- `PUT /api/auth/change-password` — Change password

### Users (admin only)
- `GET /api/users` — List all users
- `POST /api/users` — Create user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user

### Business
- `GET/PUT /api/company` — Company info (includes terms & conditions)
- `CRUD /api/categories` — Categories
- `CRUD /api/products` — Products (search, pagination)
- `CRUD /api/customers` — Customers
- `CRUD /api/invoices` — Invoices (with items & payments)
- `CRUD /api/clearance` — Clearance sales (with items & payments)
- `GET/POST /api/gold/types` — Gold type configurations
- `GET/POST /api/gold/rates` — Gold rates
- `GET/POST /api/counters` — Counter sequences

---

## Database Schema

15 tables in `backend/src/db/schema.ts`:

| Table | Description |
|-------|-------------|
| `users` | Authentication & user management |
| `companyInfo` | Single-row config (includes `invoiceTerms`, `clearanceTerms`) |
| `categories` | Product categories |
| `goldTypeConfigs` | Gold karat configurations |
| `goldRates` | Daily gold rates per karat |
| `products` | Jewellery inventory |
| `productGemstones` | Gemstone details for products |
| `customers` | Customer records |
| `invoices` | Sales invoices |
| `invoiceItems` | Invoice line items |
| `payments` | Invoice payments |
| `clearances` | Clearance sales |
| `clearanceItems` | Clearance line items |
| `clearancePayments` | Clearance payments |
| `counters` | Auto-increment sequences per shop |

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
│   │   ├── main.tsx            # Entry — StrictMode + BrowserRouter + AuthProvider + ThemeProvider
│   │   ├── App.tsx             # All routes (PrivateRoute + LoginRoute)
│   │   ├── index.css           # Tailwind directives
│   │   ├── types/index.ts      # Complete type system
│   │   ├── utils/              # cn, formatters, reportPdf, pawnCalculations
│   │   ├── contexts/           # AuthContext (JWT), ThemeContext (dark/light/system)
│   │   ├── services/api.ts     # API service layer (auth, users, company, invoices, etc.)
│   │   ├── components/         # Layout, Printables (dynamic T&C), ui/ (12 components)
│   │   └── pages/              # Login, Dashboard, Products, Customers, Invoices, Clearances, etc.
│   ├── vercel.json
│   └── vite.config.ts
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts            # Express entry point
│   │   ├── db/                 # Drizzle schema & Neon connection
│   │   ├── routes/             # 10 route files (auth, users, company, categories, etc.)
│   │   ├── middleware/         # JWT auth + error handler
│   │   └── seed/               # Seed data & runner
│   └── drizzle.config.ts
└── README.md
```
