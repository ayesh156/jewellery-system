# 💎 Royal Gems & Jewellers — Jewellery Management System

## Complete Project Documentation & GitHub Instructions

---

## 📋 Project Overview

A modern, full-featured **Jewellery Management System** built for the Sri Lankan retail jewellery market. The application manages inventory, sales invoicing, supplier purchases (GRN), repair job tracking, gold loan pawning with precise interest calculations, and business reporting — all within a responsive, theme-aware React SPA.

**Business Name:** Royal Gems & Jewellers  
**Target Market:** Sri Lankan jewellery retailers  
**Currency:** Sri Lankan Rupees (Rs.)

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI framework (with React Compiler enabled) |
| TypeScript | 5.9.3 | Type-safe development (strict mode) |
| Vite | 7.2.4 | Build tool with HMR & optimized code splitting |
| React Router DOM | 7.11.0 | Client-side SPA routing |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Lucide React | 0.562.0 | Icon library (500+ icons) |
| Radix UI | 2.2.6 | Accessible select component primitives |
| clsx + tailwind-merge | 2.1.1 / 2.5.2 | Smart class name composition |
| ESLint | 9.39.1 | Flat config linting (v9+) |
| PostCSS + Autoprefixer | 8.5.6 | CSS processing & vendor prefixes |
| pnpm | — | Package manager |

### Fonts
- **Cormorant Garamond** — Elegant serif for branding & headings
- **Inter** — Clean sans-serif for UI body text

---

## 📁 Full Project Structure

```
jewellery-system/
│
├── index.html                              # Entry HTML — root div, Google Fonts preload, viewport meta
├── package.json                            # Dependencies, scripts (dev/build/lint/preview)
├── pnpm-lock.yaml                          # pnpm lock file
├── render.yaml                             # Render.com static site deployment config
├── tsconfig.json                           # Base TypeScript config (references app + node)
├── tsconfig.app.json                       # App TS config — ES2022, strict, path alias @/*
├── tsconfig.node.json                      # Node/Vite TS config — ES2023
├── vite.config.ts                          # Vite — React plugin, path alias, manual chunks
├── tailwind.config.ts                      # Tailwind — dark mode, HSL color tokens, sidebar colors
├── postcss.config.js                       # PostCSS — tailwindcss + autoprefixer
├── eslint.config.js                        # ESLint flat config — TS + React Hooks + React Refresh
├── README.md                               # Project readme
│
├── public/
│   └── vite.svg                            # Favicon
│
└── src/
    ├── main.tsx                            # React 19 entry — StrictMode + BrowserRouter + ThemeProvider
    ├── App.tsx                             # Root component — defines all 20+ routes via React Router
    ├── index.css                           # Global Tailwind directives (@tailwind base/components/utilities)
    ├── App.css                             # App-level custom styles
    ├── assets/                             # Static images & icons
    │
    ├── types/
    │   └── index.ts                        # Complete type system (600+ lines)
    │                                       #   Customer, Supplier, Product (JewelleryItem)
    │                                       #   Invoice, GRN, RepairJob, PawnTicket
    │                                       #   InterestCalculation, GoldRate, CompanyInfo
    │                                       #   EnhancedInvoiceItem, GemstoneDetail
    │                                       #   ProductCategory, GoldTypeConfig
    │
    ├── utils/
    │   ├── cn.ts                           # clsx + tailwind-merge utility function
    │   ├── formatters.ts                   # 18 formatting functions:
    │   │                                   #   formatCurrency, formatDate, formatWeight,
    │   │                                   #   formatTroyOunces, formatCarat, formatPhone,
    │   │                                   #   generateInvoiceNumber, calculateGoldPrice,
    │   │                                   #   getKaratPurity, truncateText, capitalizeWords
    │   └── pawnCalculations.ts             # 15+ pawn/interest functions:
    │                                       #   calculatePawnInterest, calculatePreciseInterest,
    │                                       #   calculateLoanAmount, calculateMaturityDate,
    │                                       #   generateTicketNumber, formatInterestBreakdown,
    │                                       #   formatTimeElapsed, getDaysUntilMaturity
    │
    ├── contexts/
    │   └── ThemeContext.tsx                 # Theme provider — dark/light/system modes
    │                                       #   localStorage key: 'jewellery-system-theme'
    │                                       #   System preference listener (matchMedia)
    │                                       #   Adds .dark/.light class to <html>
    │
    ├── data/
    │   ├── mockData.ts                     # 50+ mock records:
    │   │                                   #   companyInfo, categories (14), customers (5),
    │   │                                   #   suppliers (4), products (20+), invoices (15+),
    │   │                                   #   grns (10+), repairJobs (12+), pawnTickets (8+),
    │   │                                   #   goldRates, goldTypes, interestConfig
    │   └── sampleData.ts                   # Sample data structures for reference
    │
    ├── components/
    │   ├── index.ts                        # Re-exports: Layout + all Printable components
    │   ├── Layout.tsx                      # Main sidebar navigation layout:
    │   │                                   #   12 nav items with collapsible submenus
    │   │                                   #   Mobile responsive with backdrop overlay
    │   │                                   #   Theme toggle button (dark → light → system)
    │   │
    │   ├── PrintableInvoice.tsx            # A5 (148×210mm) invoice print template
    │   ├── PrintableGRN.tsx                # A5 GRN print template with metal weight totals
    │   ├── PrintablePawnTicket.tsx          # A5 pawn ticket with valuation & maturity info
    │   ├── PrintableRedemptionReceipt.tsx   # A5 redemption receipt with interest breakdown
    │   ├── PrintableRepairReceipt.tsx       # A5 repair receipt with items & estimates
    │   ├── PrintableInterestReceipt.tsx     # 80mm thermal printer format (Courier New)
    │   │
    │   └── ui/                             # Reusable UI component library (12 components)
    │       ├── index.ts                    # Exports all UI components
    │       ├── Button.tsx                  # Outlined/solid variants, multiple sizes
    │       ├── Input.tsx                   # Text input with icon & label support
    │       ├── Card.tsx                    # Card + CardHeader/Title/Description/Content/Footer
    │       ├── Select.tsx                  # Native select dropdown
    │       ├── Combobox.tsx                # Searchable dropdown with icons
    │       ├── DateCombobox.tsx            # Calendar-style date picker
    │       ├── Badge.tsx                   # Status badges (success/warning/error/info)
    │       ├── Modal.tsx                   # Dialog modal with ModalContent/Footer
    │       ├── Dropdown.tsx                # Menu-style dropdown
    │       └── Table.tsx                   # Responsive table with desktop & mobile views:
    │                                       #   Table, TableHeader, TableBody, TableRow,
    │                                       #   TableHead, TableCell
    │                                       #   MobileCard, MobileCardHeader, MobileCardContent,
    │                                       #   MobileCardRow, MobileCardActions, MobileCardsContainer
    │
    └── pages/                              # 18 page components
        ├── Dashboard.tsx                   # KPI cards, revenue tracking, pending payments,
        │                                   #   inventory stats, recent invoices & GRNs
        ├── Products.tsx                    # Product CRUD, filter by category/metal, stock alerts
        ├── Customers.tsx                   # Customer management (Retail/Wholesale/VIP/Credit)
        ├── Suppliers.tsx                   # Supplier master data, payment terms, bank details
        ├── Categories.tsx                  # Dual-mode: product categories + gold type configs
        ├── Invoices.tsx                    # Sales invoice list with status/date filters
        ├── CreateInvoice.tsx               # Basic purchase invoice creation
        ├── CreateSalesInvoice.tsx           # Enhanced sales invoice with gold rate calculations,
        │                                   #   metal weight, wastage %, making charges, gemstones
        ├── GRN.tsx                         # Goods received notes list with status tracking
        ├── CreateGRN.tsx                   # GRN creation with supplier selection, tax & shipping
        ├── Pawning.tsx                     # Pawn ticket list, overdue tracking, interest visualization
        ├── CreatePawnTicket.tsx             # Gold loan creation: item valuation, interest config,
        │                                   #   loan calculation, maturity date
        ├── RedeemPawnTicket.tsx             # Redemption processing with interest recalculation
        ├── PayInterest.tsx                 # Time-precise interest payments with live calculations
        ├── RepairJobs.tsx                  # Repair job list with 9-stage workflow tracking
        ├── CreateRepairJob.tsx             # Repair job creation: items, types, estimates, priority
        ├── Reports.tsx                     # Multi-period reports: Sales, Inventory, Purchases, Customer
        ├── Settings.tsx                    # 6 tabs: Company, Profile, Notifications, Appearance,
        │                                   #   Security, Data backup
        └── ComboboxTest.tsx                # Combobox component test/demo page
```

---

## 🗺️ Routing Architecture

All routes defined in `src/App.tsx` using React Router DOM v7:

| Route | Page Component | Description |
|---|---|---|
| `/` | Dashboard | Main dashboard with KPIs & recent activity |
| `/products` | Products | Product inventory management |
| `/customers` | Customers | Customer CRUD |
| `/suppliers` | Suppliers | Supplier management |
| `/categories` | Categories | Categories + Gold Type configuration |
| `/invoices` | Invoices | Invoice list view |
| `/invoices/create` | CreateInvoice | Basic invoice creation |
| `/invoices/create-sales` | CreateSalesInvoice | Enhanced sales invoice with gold rates |
| `/invoices/:id/print` | PrintableInvoice | Print invoice (A5) |
| `/grn` | GRN | GRN list view |
| `/grn/create` | CreateGRN | Create goods received note |
| `/grn/:id/print` | PrintableGRN | Print GRN (A5) |
| `/repairs` | RepairJobs | Repair jobs list |
| `/repairs/create` | CreateRepairJob | Create repair job |
| `/repairs/:id/print` | PrintableRepairReceipt | Print repair receipt (A5) |
| `/pawning` | Pawning | Pawn tickets list |
| `/pawning/create` | CreatePawnTicket | Create pawn ticket |
| `/pawning/:id/print` | PrintablePawnTicket | Print pawn ticket (A5) |
| `/pawning/:id/redeem` | RedeemPawnTicket | Redeem pawn ticket |
| `/pawning/redemption/:id/print` | PrintableRedemptionReceipt | Print redemption receipt (A5) |
| `/pawning/:ticketId/pay-interest` | PayInterest | Pay interest on pawn |
| `/pawning/:ticketId/interest-receipt/:id/print` | PrintableInterestReceipt | Print interest receipt (80mm thermal) |
| `/reports` | Reports | Business reports & analytics |
| `/settings` | Settings | Application settings |

**Print routes** bypass the sidebar layout and auto-trigger `window.print()` on mount. Data flows via `localStorage` (newly created) or `mockData` fallback (existing records).

---

## 📦 Complete Type System

### Core Business Types

```typescript
// Customer & Supplier
CustomerType = 'retail' | 'wholesale' | 'vip' | 'credit'
Customer = { id, name, businessName, email, phone, address, city,
             registrationDate, totalPurchased, customerType, creditLimit, creditBalance }
Supplier = { id, name, companyName, contactPerson, email, phone,
             address, country, paymentTerms, bankDetails }

// Products & Inventory
MetalType = 'gold' | 'silver' | 'platinum' | 'palladium' | 'white-gold' | 'rose-gold'
GoldKarat = '24K' | '22K' | '21K' | '18K' | '14K' | '10K' | '9K'
Gemstone = { id, name, type, carat, clarity, color, origin, certified }
JewelleryItem = { sku, barcode, categoryId, metalType, karat, metalWeight,
                  makingCharges, sellingPrice, costPrice, stockQuantity, images }
JewelleryCategory = { id, name, description, icon, isActive }

// Invoicing
InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded'
PaymentMethod = 'cash' | 'card' | 'bank-transfer' | 'cheque' | 'credit' | 'upi' | 'other'
InvoiceItem = { productId, sku, productName, metalType, karat, metalWeight,
                quantity, unitPrice, discount, total }
Invoice = { invoiceNumber, customerId, items[], subtotal, discount, tax,
            total, amountPaid, balanceDue, status, issueDate, dueDate }

// GRN (Goods Received Notes)
GRNStatus = 'draft' | 'pending' | 'received' | 'partial' | 'cancelled' | 'returned'
GRNItem = { sku, productName, metalType, karat, metalWeight, quantity,
            unitCost, qualityChecked, qualityNotes }
GRN = { grnNumber, supplierId, items[], subtotal, tax, shippingCharges,
        total, receivedDate, status, qualityCheckDone }

// Repairs
RepairStatus = 'received' | 'assessment' | 'quoted' | 'approved' | 'in-repair' |
               'quality-check' | 'ready-for-collection' | 'collected' | 'cancelled'
RepairPriority = 'normal' | 'urgent' | 'express'
RepairType = 'resizing' | 'polishing' | 'stone-setting' | 'stone-replacement' |
             'chain-repair' | 'clasp-repair' | 'rhodium-plating' | 'cleaning' |
             'engraving' | 'custom-modification' | 'restoration' | 'other'
RepairJob = { jobNumber, customerId, items[], priority, estimate, status, statusHistory[] }

// Pawning (Gold Loans) — Most Complex Module
PawnStatus = 'active' | 'redeemed' | 'forfeited' | 'auctioned' | 'extended'
PawnedItem = { itemType, description, metalType, karat, grossWeight, netWeight,
               purityPercentage, marketRate, valuedAmount, condition }
PawnTicket = { ticketNumber, customerId, customerNIC, items[], totalNetWeight,
               totalValuation, principalAmount, interestRatePerMonth, pawnDate,
               maturityDate, status, lastInterestPaidToDateTime, interestPayments[] }
InterestCalculation = { principalAmount, daysElapsed, monthsCompleted,
                        firstMonthInterest, additionalMonthsInterest,
                        proratedDailyInterest, totalInterest, totalPayable, dailyRate }
PreciseInterestCalculation = InterestCalculation + { hoursElapsed, minutesElapsed,
                              calculatedFrom, calculatedTo }
InterestPayment = { ticketId, receiptNumber, paymentDateTime, paymentMethod,
                    periodStart, periodEnd, daysCharged, interestDue, amountPaid }
PawnRedemption = { ticketId, customerName, principalAmount,
                   interestCalculation, totalPayable, redemptionDate }

// Enhanced Sales (Gold Market)
EnhancedInvoiceItem = { productName, metalType, karat, metalWeight, metalValue,
                        wastagePercentage, makingCharges, hasGemstones, gemstones[] }
GemstoneDetail = { type, name, carat, clarity, color, certified, pricePerCarat, totalPrice }
GoldRate = { karat, buyingRate, sellingRate, date }

// Admin & Config
ProductCategory = { id, name, code, description, defaultMetalType, defaultKarat,
                    defaultWastage, isActive }
GoldTypeConfig = { karat, purityPercentage, description, defaultWastagePercentage, color }
CompanyInfo = { name, tagline, address, city, country, phone, email, website,
                registrationNumber, taxNumber }
```

---

## 🛠️ Utility Functions

### `utils/cn.ts` — Class Name Helper
```typescript
cn(...inputs: ClassValue[]): string
// Combines clsx + tailwind-merge for smart Tailwind class composition
```

### `utils/formatters.ts` — 18 Formatting Functions

| Function | Output Example |
|---|---|
| `formatCurrency(50000)` | `Rs. 50,000.00` |
| `formatCurrencyCompact(1500000)` | `Rs. 1.5M` |
| `formatDate('2024-03-05')` | `05 Mar 2024` |
| `formatDateTime('2024-03-05T14:30')` | `05 Mar 2024, 14:30` |
| `formatWeight(45.5)` | `45.500 g` |
| `formatWeight(1200)` | `1.200 kg` |
| `formatTroyOunces(31.1)` | `1.000 oz t` |
| `formatCarat(0.85)` | `0.85 ct` |
| `formatPercentage(12.5)` | `12.50%` |
| `formatPhone('0772345678')` | `+94 77 234 5678` |
| `generateInvoiceNumber('INV')` | `INV-2412-0001` |
| `calculateGoldPrice(10, '22K', 15000)` | Calculated price |
| `getKaratPurity('22K')` | `0.917` |
| `formatMetalType('white-gold')` | `White Gold` |

### `utils/pawnCalculations.ts` — 15+ Pawn Interest Functions

| Function | Purpose |
|---|---|
| `calculatePawnInterest()` | Standard interest calculation (5% per month) |
| `calculatePreciseInterest()` | Time-precise calculation (down to minutes) |
| `calculateRemainingInterestToMaturity()` | Remaining interest until maturity |
| `calculateLoanAmount()` | Loan amount from valuation × LTV ratio |
| `calculateMaturityDate()` | Maturity date from pawn date + loan months |
| `estimateInterestForPeriod()` | Estimate interest for N months |
| `generateTicketNumber()` | Generate `PAWN-YYMM-NNNN` |
| `generateInterestReceiptNumber()` | Generate `RECV-YYMM-NNNN` |
| `formatInterestBreakdown()` | Human-readable breakdown lines |
| `formatTimeElapsed()` | `2d 4h 30m` format |
| `getPreciseTimeDifference()` | `{days, hours, minutes}` |
| `isDayOverdue()` | Check if past maturity |
| `getDaysUntilMaturity()` | Days remaining to maturity |

---

## 🎨 Theme System

### Architecture
- **Provider:** `ThemeContext.tsx` wraps entire app
- **Modes:** `dark` | `light` | `system`
- **Storage:** `localStorage` key `jewellery-system-theme`
- **DOM:** `.dark` or `.light` class on `<html>` element
- **System Mode:** Listens to `prefers-color-scheme` via `matchMedia`

### Usage
```typescript
const { theme, setTheme, resolvedTheme } = useTheme();
```

### Tailwind Integration
- Dark mode via `dark:` prefix classes
- HSL CSS custom properties for color tokens
- Amber/Gold accent colors for jewellery branding
- Custom scrollbar styling

---

## 🖨️ Print System

| Component | Paper Size | Format |
|---|---|---|
| PrintableInvoice | A5 (148×210mm) | Company letterhead, item table, totals |
| PrintableGRN | A5 | Supplier info, items, metal weight totals |
| PrintablePawnTicket | A5 | Item details, valuation, loan amount, maturity |
| PrintableRedemptionReceipt | A5 | Interest breakdown, principal, total payable |
| PrintableRepairReceipt | A5 | Repair items, estimates, job status |
| PrintableInterestReceipt | 80mm | Thermal printer format (Courier New monospace) |

**Print Flow:**
1. User creates a record → data saved to `localStorage`
2. Navigate to print route → component reads from `localStorage`
3. Falls back to `mockData` if no localStorage data
4. `window.print()` triggered automatically on mount
5. CSS `@media print` rules handle layout (6mm margins, color preservation)

---

## 🏗️ Build & Code Splitting

### Vite Chunking Strategy (vite.config.ts)

| Chunk | Contents |
|---|---|
| `vendor-react` | react, react-dom, react-router-dom |
| `vendor-icons` | lucide-react |
| `vendor` | All other node_modules |
| `pages-pawning` | Pawn, PayInterest, Redeem pages |
| `pages-repairs` | Repair pages |
| `pages-invoices` | Invoice, Sales pages |
| `pages-grn` | GRN pages |
| `pages-misc` | Dashboard, Products, Customers, etc. |
| `printables` | All PrintableXxx components |

### Path Alias
```typescript
'@' → './src'     // Usage: import { Button } from '@/components/ui'
```

---

## 🚀 Development & Deployment

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:5173)
pnpm run dev

# Type check + production build
pnpm run build

# Preview production build locally
pnpm run preview

# Lint
pnpm run lint
```

### Render.com Deployment

This project is configured for **Render.com Static Site** deployment:

1. **Connect GitHub repository** to Render.com
2. **Blueprint auto-detection:** Render reads `render.yaml`
3. **Build command:** `pnpm install && pnpm run build`
4. **Publish directory:** `./dist`
5. **SPA routing:** All routes rewrite to `/index.html`

#### render.yaml Configuration
```yaml
services:
  - type: web
    name: jewellery-system
    runtime: static
    buildCommand: pnpm install && pnpm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Manual Render.com Setup (Alternative)

If not using `render.yaml` Blueprint:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Static Site**
3. Connect your GitHub repo
4. Set **Build Command:** `pnpm install && pnpm run build`
5. Set **Publish Directory:** `dist`
6. Add rewrite rule: `/*` → `/index.html`
7. Deploy

---

## 📊 Key Business Features

### 1. Inventory Management
- Product CRUD with SKU, barcode, metal type, karat classification
- Stock level tracking with low stock alerts
- 14 jewellery categories (Rings, Necklaces, Earrings, etc.)
- Gold type configuration (24K through 9K with purity percentages)

### 2. Sales & Invoicing
- **Basic invoices** — standard product-based invoicing
- **Enhanced sales invoices** — gold rate calculations, metal weight, wastage %, making charges, gemstone pricing
- Multiple payment methods (Cash, Card, Bank Transfer, Cheque, Credit, UPI)
- Invoice status tracking (Draft → Pending → Paid/Partial/Cancelled)

### 3. Supplier & Purchasing (GRN)
- Supplier management with bank details & payment terms
- Goods Received Notes with quality check workflow
- Tax & shipping charges tracking

### 4. Repair Job Management
- **9-stage workflow:** Received → Assessment → Quoted → Approved → In-Repair → Quality Check → Ready → Collected → Cancelled
- 12 repair types (Resizing, Polishing, Stone Setting, etc.)
- Priority levels (Normal, Urgent, Express)
- Estimate tracking with labor, material, and additional costs

### 5. Pawning / Gold Loan System (Most Complex)
- **Gold loan creation** with item-level valuation
- **5% per month interest** model (configurable)
- **Time-precise calculations** — down to hours and minutes
- **Interest payments** — partial payments with period tracking
- **Redemption** — full principal + interest settlement
- **Overdue tracking** — maturity date monitoring
- **NIC-based** customer identification (Sri Lankan national ID)

### 6. Reports & Analytics
- Multi-period filtering (Today, This Week, This Month, This Quarter, This Year)
- Sales analytics, inventory summaries, purchase reports, customer insights

### 7. Settings
- Company information management
- User profile settings
- Notification preferences
- Appearance (theme switching)
- Security settings
- Data backup options

---

## 🎯 Design Principles

1. **Client-side only** — All data is mocked; no backend API (ready for future integration)
2. **Type-safe** — Strict TypeScript across all modules
3. **Responsive** — Mobile-first with sidebar collapse & mobile card views
4. **Print-optimized** — Precision A5 & 80mm thermal printer templates
5. **Theme-aware** — Dark/Light/System modes with HSL tokens
6. **Code-split** — Optimized lazy loading by module
7. **React Compiler** — Experimental React compiler enabled for auto-memoization

---

## 📝 Notes for Contributors

- **Package manager:** Use `pnpm` (not npm or yarn)
- **Node version:** Requires Node.js 18+ (for ES2022 support)
- **TypeScript:** Strict mode enabled — all types must be explicit
- **Styling:** Use Tailwind classes only; avoid custom CSS
- **Components:** Use the UI component library from `src/components/ui/`
- **Icons:** Import from `lucide-react`
- **Data:** Mock data in `src/data/mockData.ts` — no real API calls
- **Formatting:** Use utility functions from `src/utils/formatters.ts`
- **State:** React hooks only (useState, useMemo, useCallback, useEffect)
- **Routing:** All new routes must be added to `src/App.tsx`
