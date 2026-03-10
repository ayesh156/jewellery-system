// ==========================================
// Jewellery System Type Definitions
// ==========================================

// Customer Types
export type CustomerType = 'retail' | 'wholesale' | 'vip' | 'credit';

export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  phone: string;
  phone2?: string;
  nic?: string; // National ID Card
  address: string;
  city: string;
  photo?: string;
  registrationDate: string;
  totalPurchased: number;
  customerType: CustomerType;
  isActive: boolean;
  creditLimit?: number;
  creditBalance?: number;
}

// Supplier Management
export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone: string;
  phone2?: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  registrationDate: string;
  isActive: boolean;
  totalPurchased: number;
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: string;
  notes?: string;
  bankName?: string;
  bankAccount?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch?: string;
  };
}

// Metal Types
export type MetalType = 'gold' | 'silver' | 'platinum' | 'palladium' | 'white-gold' | 'rose-gold';

// Gold Karats
export type GoldKarat = '24K' | '22K' | '21K' | '18K' | '14K' | '10K' | '9K';

// Jewellery Categories
export interface JewelleryCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  isActive: boolean;
}

// Gemstone Types
export interface Gemstone {
  id: string;
  name: string;
  type: 'diamond' | 'ruby' | 'sapphire' | 'emerald' | 'pearl' | 'topaz' | 'amethyst' | 'opal' | 'other';
  carat?: number;
  clarity?: string;
  cut?: string;
  color?: string;
  origin?: string;
  certified?: boolean;
  certificateNumber?: string;
}

// Product/Jewellery Item
export interface JewelleryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  
  // Metal Details
  metalType: MetalType;
  karat?: GoldKarat;
  metalWeight: number; // in grams
  metalPurity?: number; // percentage
  
  // Gemstones
  hasGemstones: boolean;
  gemstones?: Gemstone[];
  totalGemstoneWeight?: number;
  
  // Pricing
  metalRate: number; // per gram
  makingCharges: number;
  gemstoneValue?: number;
  otherCharges?: number;
  sellingPrice: number;
  costPrice: number;
  
  // Stock
  stockQuantity: number;
  reorderLevel?: number;
  
  // Images
  images?: string[];
  
  // Tracking
  supplierId?: string;
  supplierName?: string;
  dateAdded: string;
  lastUpdated?: string;
  isActive: boolean;
}

// Invoice Item
export interface InvoiceItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  description?: string;
  metalType: MetalType;
  karat?: GoldKarat;
  metalWeight: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  total: number;
}

// Invoice Status
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded';

// Payment Method
export type PaymentMethod = 'cash' | 'card' | 'bank-transfer' | 'cheque' | 'credit' | 'upi' | 'other';

// Payment Record
export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
}

// Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  
  items: InvoiceItem[];
  
  // Financial
  subtotal: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  tax: number;
  taxRate?: number;
  total: number;
  
  // Payment
  amountPaid: number;
  balanceDue: number;
  payments?: Payment[];
  paymentMethod?: PaymentMethod;
  
  // Dates
  issueDate: string;
  dueDate?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Notes
  notes?: string;
  termsAndConditions?: string;
  
  // Tracking
  createdBy?: string;
  createdByUserId?: string;  // Unique user identifier (e.g., USR-01)
  createdAt: string;
  updatedAt?: string;
}

// Clearance Sale
export interface Clearance {
  id: string;
  clearanceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;

  items: InvoiceItem[];

  // Financial
  subtotal: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  tax: number;
  taxRate?: number;
  total: number;

  // Payment
  amountPaid: number;
  balanceDue: number;
  payments?: Payment[];
  paymentMethod?: PaymentMethod;

  // Dates
  issueDate: string;
  dueDate?: string;

  // Status
  status: InvoiceStatus;

  // Clearance-specific
  clearanceReason?: string;

  // Notes
  notes?: string;

  // Tracking
  createdBy?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

// GRN (Goods Received Note) Item
export interface GRNItem {
  id: string;
  productId?: string;
  sku: string;
  productName: string;
  description?: string;
  metalType: MetalType;
  karat?: GoldKarat;
  metalWeight: number;
  purityPercentage?: number;
  quantity: number;
  unitCost: number;
  makingCharges?: number;
  gemstoneValue?: number;
  otherCharges?: number;
  total: number;
  
  // Quality Check
  qualityChecked?: boolean;
  qualityNotes?: string;
  condition?: 'new' | 'good' | 'fair' | 'damaged';
}

// GRN Status
export type GRNStatus = 'draft' | 'pending' | 'received' | 'partial' | 'cancelled' | 'returned';

// GRN (Goods Received Note)
export interface GRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  
  // Reference
  purchaseOrderNumber?: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  
  items: GRNItem[];
  
  // Financial
  subtotal: number;
  discount?: number;
  tax?: number;
  taxRate?: number;
  shippingCharges?: number;
  otherCharges?: number;
  total: number;
  
  // Payment
  amountPaid: number;
  balanceDue: number;
  paymentTerms?: string;
  
  // Dates
  receivedDate: string;
  expectedDate?: string;
  
  // Status
  status: GRNStatus;
  
  // Quality Check
  qualityCheckDone: boolean;
  qualityCheckDate?: string;
  qualityCheckBy?: string;
  
  // Notes
  notes?: string;
  
  // Tracking
  receivedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// Company/Store Information
export interface CompanyInfo {
  name: string;
  tagline?: string;
  logo?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phone2?: string;
  email: string;
  website?: string;
  registrationNumber?: string;
  taxNumber?: string;
  invoiceTerms?: string;
  clearanceTerms?: string;
}

// ==========================================
// Gold Rate Management
// ==========================================
export interface GoldRate {
  id: string;
  karat: GoldKarat;
  buyingRate: number; // per gram
  sellingRate: number; // per gram
  date: string;
  updatedBy?: string;
}

// ==========================================
// Enhanced Invoice Item for Sri Lankan Market
// ==========================================
export interface EnhancedInvoiceItem {
  id: string;
  productId?: string;
  sku?: string;
  productName: string;
  description?: string;
  
  // Metal Details
  metalType: MetalType;
  karat?: GoldKarat;
  metalWeight: number; // in grams
  metalRate: number; // current gold rate per gram
  metalValue: number; // weight * rate
  
  // Labor & Making Charges
  wastagePercentage: number; // typical wastage 8-12%
  wastageWeight: number; // calculated wastage in grams
  makingCharges: number; // labor charges
  makingChargeType: 'per-gram' | 'fixed' | 'percentage';
  
  // Gemstone Details
  hasGemstones: boolean;
  gemstones?: GemstoneDetail[];
  totalGemstoneValue: number;
  
  // Pricing
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
}

export interface GemstoneDetail {
  id: string;
  type: string;
  name: string;
  carat: number;
  clarity?: string;
  color?: string;
  cut?: string;
  origin?: string;
  certified: boolean;
  certificateNumber?: string;
  pricePerCarat: number;
  totalPrice: number;
}

// ==========================================
// Repair & Service Module (Job Cards)
// ==========================================
export type RepairStatus = 
  | 'received' 
  | 'assessment' 
  | 'quoted' 
  | 'approved' 
  | 'in-repair' 
  | 'quality-check'
  | 'ready-for-collection' 
  | 'collected' 
  | 'cancelled';

export type RepairPriority = 'normal' | 'urgent' | 'express';

export type RepairType = 
  | 'resizing' 
  | 'polishing' 
  | 'stone-setting' 
  | 'stone-replacement'
  | 'chain-repair' 
  | 'clasp-repair' 
  | 'rhodium-plating'
  | 'cleaning'
  | 'engraving'
  | 'custom-modification'
  | 'restoration'
  | 'other';

export interface RepairItem {
  id: string;
  itemType: string; // e.g., "Ring", "Necklace", "Bangle"
  itemDescription: string;
  metalType: MetalType;
  karat?: GoldKarat;
  initialWeight: number; // weight when received
  finalWeight?: number; // weight after repair (for tracking)
  
  // Gemstones if any
  hasGemstones: boolean;
  gemstoneDescription?: string;
  gemstoneCount?: number;
  
  // Damage/Issue details
  issueDescription: string;
  repairTypes: RepairType[];
  
  // Photos
  beforePhotos?: string[];
  afterPhotos?: string[];
}

export interface RepairEstimate {
  laborCost: number;
  materialCost: number;
  additionalMetalWeight?: number;
  additionalMetalRate?: number;
  additionalMetalCost?: number;
  gemstoneReplacementCost?: number;
  otherCosts?: number;
  otherCostsDescription?: string;
  totalEstimate: number;
  validUntil?: string;
}

export interface RepairJob {
  id: string;
  jobNumber: string;
  
  // Customer Information
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNIC?: string;
  
  // Items
  items: RepairItem[];
  
  // Repair Details
  repairDescription: string;
  priority: RepairPriority;
  
  // Estimate
  estimate?: RepairEstimate;
  estimateApproved: boolean;
  estimateApprovedDate?: string;
  
  // Dates
  receivedDate: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  collectionDate?: string;
  
  // Payment
  advancePayment: number;
  finalAmount?: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod?: PaymentMethod;
  
  // Status
  status: RepairStatus;
  statusHistory: StatusUpdate[];
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  // Tracking
  receivedBy: string;
  receivedByUserId?: string;  // Unique user identifier (e.g., USR-01)
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusUpdate {
  status: RepairStatus;
  date: string;
  updatedBy: string;
  notes?: string;
}

// ==========================================
// Category Management (Admin)
// ==========================================
export interface GoldTypeConfig {
  id: string;
  karat: GoldKarat;
  purityPercentage: number;
  description: string;
  isActive: boolean;
  defaultWastagePercentage: number;
  color?: string; // for UI display
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  icon?: string;
  image?: string;
  defaultMetalType?: MetalType;
  defaultKarat?: GoldKarat;
  defaultWastage?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Pawning (Gold Loan) Module
// ==========================================

export type PawnStatus = 
  | 'active'          // Loan is currently active
  | 'redeemed'        // Customer has redeemed the item
  | 'forfeited'       // Item forfeited due to non-payment
  | 'auctioned'       // Item has been auctioned
  | 'extended';       // Loan period extended

export interface PawnedItem {
  id: string;
  itemType: string;           // e.g., "Chain", "Ring", "Bangle"
  description: string;        // Detailed description
  metalType: MetalType;
  karat: GoldKarat;
  grossWeight: number;        // Total weight in grams
  netWeight: number;          // Weight after deductions (stones, etc.)
  purityPercentage: number;   // Actual purity percentage
  
  // Valuation
  marketRate: number;         // Current market rate per gram
  valuedAmount: number;       // Appraised value
  
  // Gemstones if any
  hasGemstones: boolean;
  gemstoneDescription?: string;
  gemstoneDeductionWeight?: number;
  
  // Condition
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionNotes?: string;
  
  // Photos for record
  photos?: string[];
}

export interface InterestCalculation {
  principalAmount: number;
  daysElapsed: number;
  monthsCompleted: number;
  remainingDays: number;
  
  // Interest breakdown
  firstMonthInterest: number;       // Fixed 5% for first month (even for 1 day)
  additionalMonthsInterest: number; // 5% per additional complete month
  proratedDailyInterest: number;    // Pro-rata interest for remaining days
  
  totalInterest: number;
  totalPayable: number;
  
  // Rates used
  interestRatePerMonth: number;     // Configurable rate (default 5%)
  dailyRate: number;                // Pro-rata daily rate
}

export interface PawnTicket {
  id: string;
  ticketNumber: string;
  
  // Customer Details
  customerId?: string;
  customerName: string;
  customerNIC: string;           // National ID - mandatory for pawning
  customerPhone: string;
  customerAddress: string;
  customerPhoto?: string;
  
  // Items
  items: PawnedItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  
  // Valuation & Loan
  totalValuation: number;        // Total appraised value
  loanToValueRatio: number;      // Typically 60-75% in Sri Lanka
  principalAmount: number;       // Loan amount given
  
  // Interest Configuration
  interestRatePerMonth: number;  // Configurable (default 5%)
  
  // Dates
  pawnDate: string;
  maturityDate: string;          // Typically 3-12 months
  gracePeriodDays: number;       // Days after maturity before forfeiture
  
  // Status
  status: PawnStatus;
  
  // Payment tracking
  interestPaid: number;          // Total interest payments made
  lastInterestPaymentDate?: string;
  lastInterestPaidToDateTime?: string;  // Interest paid up to this precise datetime
  
  // Partial interest payments history
  interestPayments?: InterestPayment[];
  
  // Redemption details (filled when redeemed)
  redemptionDate?: string;
  redemptionAmount?: number;
  redemptionInterest?: number;
  
  // Extension history
  extensions?: PawnExtension[];
  
  // Notes
  internalNotes?: string;
  
  // Tracking
  createdBy: string;
  createdByUserId?: string;  // Unique user identifier (e.g., USR-01)
  createdAt: string;
  updatedAt: string;
}

export interface PawnExtension {
  id: string;
  extensionDate: string;
  previousMaturityDate: string;
  newMaturityDate: string;
  interestPaidToDate: number;
  extensionFee?: number;
  processedBy: string;
  notes?: string;
}

// ==========================================
// Partial Interest Payment System
// ==========================================

/**
 * Represents a partial interest payment made by a customer before full redemption.
 * This allows customers to pay interest up to a specific moment in time,
 * effectively resetting the interest accrual from that point forward.
 */
export interface InterestPayment {
  id: string;
  ticketId: string;
  ticketNumber: string;
  receiptNumber: string;              // Unique receipt number for this payment
  
  // Payment Details
  paymentDateTime: string;            // ISO datetime when payment was made (with time)
  paymentMethod: PaymentMethod;
  
  // Interest Period Covered
  periodStart: string;                // Interest accrued from (datetime)
  periodEnd: string;                  // Interest paid up to (datetime)
  
  // Calculation at time of payment
  daysCharged: number;                // Days calculated for this payment
  hoursCharged?: number;              // Hours (for same-day precision if needed)
  interestRate: number;               // Rate applied
  
  // Amounts
  principalAmount: number;            // Principal used for calculation (reference)
  interestDue: number;                // Interest calculated for the period
  amountPaid: number;                 // Actual amount paid
  excessAmount?: number;              // Any excess paid (credited to next period)
  
  // Customer Info (denormalized for receipts)
  customerName: string;
  customerNIC: string;
  customerPhone: string;
  
  // Processing
  processedBy: string;
  createdAt: string;
  
  // Notes
  notes?: string;
}

/**
 * Time-based interest calculation result
 * Used for precise calculations down to the minute
 */
export interface PreciseInterestCalculation extends InterestCalculation {
  // Time precision fields
  hoursElapsed: number;
  minutesElapsed: number;
  
  // Precise datetime range
  calculatedFrom: string;             // ISO datetime
  calculatedTo: string;               // ISO datetime
  
  // Time-based breakdown
  fullDaysInterest: number;
  partialDayInterest: number;
  
  // For partial payment scenarios
  previousPaymentsTotal: number;      // Sum of all previous interest payments
  outstandingInterest: number;        // Current outstanding interest after payments
}

export interface PawnRedemption {
  id: string;
  ticketId: string;
  ticketNumber: string;
  
  // Customer
  customerName: string;
  customerNIC: string;
  
  // Calculation
  principalAmount: number;
  interestCalculation: InterestCalculation;
  
  // Payment
  totalPayable: number;
  amountReceived: number;
  changeGiven: number;
  paymentMethod: PaymentMethod;
  
  // Dates
  pawnDate: string;
  redemptionDate: string;
  
  // Processing
  processedBy: string;
  createdAt: string;
  
  // Notes
  notes?: string;
}

// Interest rate configuration
export interface PawnInterestConfig {
  id: string;
  name: string;
  ratePerMonth: number;         // e.g., 5 for 5%
  minimumDays: number;          // Minimum days for first interest (usually 1)
  gracePeriodDays: number;      // Grace period after maturity
  loanToValueRatio: number;     // Max LTV ratio (e.g., 0.75 for 75%)
  isDefault: boolean;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}
