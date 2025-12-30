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
}
