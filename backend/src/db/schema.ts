import {
  mysqlTable,
  varchar,
  text,
  boolean,
  int,
  decimal,
  timestamp,
  mysqlEnum,
  json,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

// ==========================================
// Enums
// ==========================================

export const metalTypeEnum = mysqlEnum('metal_type', [
  'gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold',
]);

export const goldKaratEnum = mysqlEnum('gold_karat', [
  '24K', '22K', '21K', '18K', '14K', '10K', '9K',
]);

export const gemstoneTypeEnum = mysqlEnum('gemstone_type', [
  'diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'topaz', 'amethyst', 'opal', 'other',
]);

export const customerTypeEnum = mysqlEnum('customer_type', [
  'retail', 'wholesale', 'vip', 'credit',
]);

export const invoiceStatusEnum = mysqlEnum('invoice_status', [
  'draft', 'pending', 'paid', 'partial', 'cancelled', 'refunded',
]);

export const paymentMethodEnum = mysqlEnum('payment_method', [
  'cash', 'card', 'bank-transfer', 'cheque', 'credit', 'upi', 'other',
]);

// ==========================================
// Categories
// ==========================================

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: varchar('parent_id', { length: 50 }).references((): any => categories.id),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// Products (Jewellery Items)
// ==========================================

export const products = mysqlTable('products', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  categoryId: varchar('category_id', { length: 50 }).notNull()
    .references(() => categories.id),

  // Metal Details
  metalType: metalTypeEnum.notNull(),
  karat: goldKaratEnum,
  metalWeight: decimal('metal_weight', { precision: 10, scale: 3 }).notNull(), // grams
  metalPurity: decimal('metal_purity', { precision: 5, scale: 2 }),            // percentage

  // Gemstones
  hasGemstones: boolean('has_gemstones').notNull().default(false),
  totalGemstoneWeight: decimal('total_gemstone_weight', { precision: 8, scale: 3 }),

  // Pricing — NUMERIC for exact Rs. calculations
  metalRate: decimal('metal_rate', { precision: 12, scale: 2 }).notNull(),     // per gram
  makingCharges: decimal('making_charges', { precision: 12, scale: 2 }).notNull(),
  gemstoneValue: decimal('gemstone_value', { precision: 12, scale: 2 }),
  otherCharges: decimal('other_charges', { precision: 12, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 14, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 14, scale: 2 }).notNull(),

  // Stock
  stockQuantity: int('stock_quantity').notNull().default(0),
  reorderLevel: int('reorder_level'),

  // Images
  images: json('images').$type<string[]>(),

  // Tracking
  supplierId: varchar('supplier_id', { length: 50 }),
  supplierName: varchar('supplier_name', { length: 200 }),
  isActive: boolean('is_active').notNull().default(true),
  dateAdded: timestamp('date_added').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('products_sku_idx').on(table.sku),
]);

// ==========================================
// Product Gemstones (1-to-many)
// ==========================================

export const productGemstones = mysqlTable('product_gemstones', {
  id: varchar('id', { length: 50 }).primaryKey(),
  productId: varchar('product_id', { length: 50 }).notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: gemstoneTypeEnum.notNull(),
  carat: decimal('carat', { precision: 6, scale: 3 }),
  clarity: varchar('clarity', { length: 50 }),
  cut: varchar('cut', { length: 50 }),
  color: varchar('color', { length: 50 }),
  origin: varchar('origin', { length: 100 }),
  certified: boolean('certified').default(false),
  certificateNumber: varchar('certificate_number', { length: 100 }),
});

// ==========================================
// Gold Type Configurations
// ==========================================

export const goldTypeConfigs = mysqlTable('gold_type_configs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  karat: goldKaratEnum.notNull(),
  purityPercentage: decimal('purity_percentage', { precision: 5, scale: 2 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  defaultWastagePercentage: decimal('default_wastage_percentage', { precision: 5, scale: 2 }).notNull(),
  color: varchar('color', { length: 20 }),
});

// ==========================================
// Gold Rates
// ==========================================

export const goldRates = mysqlTable('gold_rates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  karat: goldKaratEnum.notNull(),
  buyingRate: decimal('buying_rate', { precision: 12, scale: 2 }).notNull(),
  sellingRate: decimal('selling_rate', { precision: 12, scale: 2 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  updatedBy: varchar('updated_by', { length: 100 }),
});

// ==========================================
// Company Info (single-row config)
// ==========================================

export const companyInfo = mysqlTable('company_info', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  name: varchar('name', { length: 200 }).notNull(),
  tagline: varchar('tagline', { length: 300 }),
  logo: text('logo'),
  address: varchar('address', { length: 300 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  phone2: varchar('phone2', { length: 20 }),
  email: varchar('email', { length: 200 }).notNull(),
  website: varchar('website', { length: 200 }),
  registrationNumber: varchar('registration_number', { length: 50 }),
  taxNumber: varchar('tax_number', { length: 50 }),
  defaultTaxRate: decimal('default_tax_rate', { precision: 5, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 10 }).default('LKR'),
  invoiceTerms: text('invoice_terms'),
  clearanceTerms: text('clearance_terms'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// Customers
// ==========================================

export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  businessName: varchar('business_name', { length: 200 }),
  email: varchar('email', { length: 200 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  phone2: varchar('phone2', { length: 20 }),
  nic: varchar('nic', { length: 20 }),
  address: varchar('address', { length: 300 }),
  city: varchar('city', { length: 100 }),
  photo: text('photo'),
  registrationDate: varchar('registration_date', { length: 10 }).notNull(),
  totalPurchased: decimal('total_purchased', { precision: 14, scale: 2 }).notNull().default('0'),
  customerType: customerTypeEnum.notNull().default('retail'),
  isActive: boolean('is_active').notNull().default(true),
  creditLimit: decimal('credit_limit', { precision: 14, scale: 2 }),
  creditBalance: decimal('credit_balance', { precision: 14, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// Invoices
// ==========================================

export const invoices = mysqlTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  customerId: varchar('customer_id', { length: 50 }).notNull()
    .references(() => customers.id),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerAddress: varchar('customer_address', { length: 300 }),

  // Financial
  subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 14, scale: 2 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 20 }),
  tax: decimal('tax', { precision: 14, scale: 2 }).notNull().default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
  total: decimal('total', { precision: 14, scale: 2 }).notNull(),

  // Payment
  amountPaid: decimal('amount_paid', { precision: 14, scale: 2 }).notNull().default('0'),
  balanceDue: decimal('balance_due', { precision: 14, scale: 2 }).notNull().default('0'),
  paymentMethod: paymentMethodEnum,

  // Dates
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  dueDate: varchar('due_date', { length: 10 }),

  // Status
  status: invoiceStatusEnum.notNull().default('draft'),

  // Notes
  notes: text('notes'),

  // Tracking
  createdBy: varchar('created_by', { length: 100 }),
  createdByUserId: varchar('created_by_user_id', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('invoices_number_idx').on(table.invoiceNumber),
]);

// ==========================================
// Invoice Items
// ==========================================

export const invoiceItems = mysqlTable('invoice_items', {
  id: varchar('id', { length: 50 }).primaryKey(),
  invoiceId: varchar('invoice_id', { length: 50 }).notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 50 }),
  sku: varchar('sku', { length: 50 }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  description: text('description'),
  metalType: metalTypeEnum,
  karat: goldKaratEnum,
  metalWeight: decimal('metal_weight', { precision: 10, scale: 3 }),
  quantity: int('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 14, scale: 2 }),
  discount: decimal('discount', { precision: 14, scale: 2 }),
  discountType: varchar('discount_type', { length: 20 }),
  total: decimal('total', { precision: 14, scale: 2 }).notNull(),
});

// ==========================================
// Payments
// ==========================================

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  invoiceId: varchar('invoice_id', { length: 50 }).notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  method: paymentMethodEnum.notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// Clearances (Clearance Sales)
// ==========================================

export const clearances = mysqlTable('clearances', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clearanceNumber: varchar('clearance_number', { length: 50 }).notNull(),
  customerId: varchar('customer_id', { length: 50 }).notNull()
    .references(() => customers.id),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerAddress: varchar('customer_address', { length: 300 }),

  // Financial
  subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 14, scale: 2 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 20 }),
  tax: decimal('tax', { precision: 14, scale: 2 }).notNull().default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
  total: decimal('total', { precision: 14, scale: 2 }).notNull(),

  // Payment
  amountPaid: decimal('amount_paid', { precision: 14, scale: 2 }).notNull().default('0'),
  balanceDue: decimal('balance_due', { precision: 14, scale: 2 }).notNull().default('0'),
  paymentMethod: paymentMethodEnum,

  // Dates
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  dueDate: varchar('due_date', { length: 10 }),

  // Status
  status: invoiceStatusEnum.notNull().default('draft'),

  // Clearance-specific
  clearanceReason: text('clearance_reason'),

  // Notes
  notes: text('notes'),

  // Tracking
  createdBy: varchar('created_by', { length: 100 }),
  createdByUserId: varchar('created_by_user_id', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('clearances_number_idx').on(table.clearanceNumber),
]);

// ==========================================
// Clearance Items
// ==========================================

export const clearanceItems = mysqlTable('clearance_items', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clearanceId: varchar('clearance_id', { length: 50 }).notNull()
    .references(() => clearances.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 50 }),
  sku: varchar('sku', { length: 50 }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  description: text('description'),
  metalType: metalTypeEnum,
  karat: goldKaratEnum,
  metalWeight: decimal('metal_weight', { precision: 10, scale: 3 }),
  quantity: int('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 14, scale: 2 }),
  discount: decimal('discount', { precision: 14, scale: 2 }),
  discountType: varchar('discount_type', { length: 20 }),
  total: decimal('total', { precision: 14, scale: 2 }).notNull(),
});

// ==========================================
// Clearance Payments
// ==========================================

export const clearancePayments = mysqlTable('clearance_payments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clearanceId: varchar('clearance_id', { length: 50 }).notNull()
    .references(() => clearances.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  method: paymentMethodEnum.notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// Users (Authentication & Authorization)
// ==========================================

export const userRoleEnum = mysqlEnum('user_role', [
  'admin', 'manager', 'sales', 'accountant',
]);

export const users = mysqlTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum.notNull().default('sales'),
  shopCode: varchar('shop_code', { length: 10 }).notNull().default('A'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_username_idx').on(table.username),
  uniqueIndex('users_email_idx').on(table.email),
]);

// ==========================================
// Counters (Auto-increment sequences)
// ==========================================

export const counters = mysqlTable('counters', {
  id: varchar('id', { length: 50 }).primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  shopCode: varchar('shop_code', { length: 10 }).notNull().default('A'),
  prefix: varchar('prefix', { length: 20 }).notNull(),
  lastNumber: int('last_number').notNull().default(0),
  paddingLength: int('padding_length').notNull().default(4),
}, (table) => [
  uniqueIndex('counters_entity_shop_idx').on(table.entityType, table.shopCode),
]);
