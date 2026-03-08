import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ==========================================
// Enums
// ==========================================

export const metalTypeEnum = pgEnum('metal_type', [
  'gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold',
]);

export const goldKaratEnum = pgEnum('gold_karat', [
  '24K', '22K', '21K', '18K', '14K', '10K', '9K',
]);

export const gemstoneTypeEnum = pgEnum('gemstone_type', [
  'diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'topaz', 'amethyst', 'opal', 'other',
]);

// ==========================================
// Categories
// ==========================================

export const categories = pgTable('categories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: varchar('parent_id', { length: 50 }).references((): any => categories.id),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// Products (Jewellery Items)
// ==========================================

export const products = pgTable('products', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  categoryId: varchar('category_id', { length: 50 }).notNull()
    .references(() => categories.id),

  // Metal Details
  metalType: metalTypeEnum('metal_type').notNull(),
  karat: goldKaratEnum('karat'),
  metalWeight: numeric('metal_weight', { precision: 10, scale: 3 }).notNull(), // grams
  metalPurity: numeric('metal_purity', { precision: 5, scale: 2 }),            // percentage

  // Gemstones
  hasGemstones: boolean('has_gemstones').notNull().default(false),
  totalGemstoneWeight: numeric('total_gemstone_weight', { precision: 8, scale: 3 }),

  // Pricing — NUMERIC for exact Rs. calculations
  metalRate: numeric('metal_rate', { precision: 12, scale: 2 }).notNull(),     // per gram
  makingCharges: numeric('making_charges', { precision: 12, scale: 2 }).notNull(),
  gemstoneValue: numeric('gemstone_value', { precision: 12, scale: 2 }),
  otherCharges: numeric('other_charges', { precision: 12, scale: 2 }),
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull(),

  // Stock
  stockQuantity: integer('stock_quantity').notNull().default(0),
  reorderLevel: integer('reorder_level'),

  // Images
  images: jsonb('images').$type<string[]>(),

  // Tracking
  supplierId: varchar('supplier_id', { length: 50 }),
  supplierName: varchar('supplier_name', { length: 200 }),
  isActive: boolean('is_active').notNull().default(true),
  dateAdded: timestamp('date_added', { withTimezone: true }).notNull().defaultNow(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('products_sku_idx').on(table.sku),
]);

// ==========================================
// Product Gemstones (1-to-many)
// ==========================================

export const productGemstones = pgTable('product_gemstones', {
  id: varchar('id', { length: 50 }).primaryKey(),
  productId: varchar('product_id', { length: 50 }).notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: gemstoneTypeEnum('type').notNull(),
  carat: numeric('carat', { precision: 6, scale: 3 }),
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

export const goldTypeConfigs = pgTable('gold_type_configs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  karat: goldKaratEnum('karat').notNull(),
  purityPercentage: numeric('purity_percentage', { precision: 5, scale: 2 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  defaultWastagePercentage: numeric('default_wastage_percentage', { precision: 5, scale: 2 }).notNull(),
  color: varchar('color', { length: 20 }),
});

// ==========================================
// Gold Rates
// ==========================================

export const goldRates = pgTable('gold_rates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  karat: goldKaratEnum('karat').notNull(),
  buyingRate: numeric('buying_rate', { precision: 12, scale: 2 }).notNull(),
  sellingRate: numeric('selling_rate', { precision: 12, scale: 2 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  updatedBy: varchar('updated_by', { length: 100 }),
});

// ==========================================
// Company Info (single-row config)
// ==========================================

export const companyInfo = pgTable('company_info', {
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
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
