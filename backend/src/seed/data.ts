import type {
  categories,
  products,
  productGemstones,
  goldTypeConfigs,
  goldRates,
  companyInfo,
} from '../db/schema.js';

type CategoryInsert = typeof categories.$inferInsert;
type ProductInsert = typeof products.$inferInsert;
type GemstoneInsert = typeof productGemstones.$inferInsert;
type GoldTypeInsert = typeof goldTypeConfigs.$inferInsert;
type GoldRateInsert = typeof goldRates.$inferInsert;
type CompanyInfoInsert = typeof companyInfo.$inferInsert;

// ==========================================
// Company Info
// ==========================================

export const seedCompanyInfo: CompanyInfoInsert = {
  id: 'default',
  name: 'Onelka Jewellery',
  tagline: 'Exquisite Craftsmanship Since 1985',
  address: 'No. 123, Galle Road',
  city: 'Colombo 03',
  country: 'Sri Lanka',
  phone: '+94 11 234 5678',
  phone2: '+94 77 123 4567',
  email: 'info@onelkajewellery.lk',
  website: 'www.onelkajewellery.lk',
  registrationNumber: 'REG-2024-001',
  taxNumber: 'TIN-123456789',
};

// ==========================================
// Categories — 14 jewellery categories
// ==========================================

export const seedCategories: CategoryInsert[] = [
  { id: 'cat-001', name: 'Necklaces',           description: 'Gold, silver and platinum necklaces',   isActive: true },
  { id: 'cat-002', name: 'Earrings',            description: 'Studs, drops, hoops and danglers',      isActive: true },
  { id: 'cat-003', name: 'Rings',               description: 'Engagement, wedding and fashion rings', isActive: true },
  { id: 'cat-004', name: 'Bangles & Bracelets', description: 'Traditional and modern bangles',        isActive: true },
  { id: 'cat-005', name: 'Pendants',            description: 'Gold and gemstone pendants',            isActive: true },
  { id: 'cat-006', name: 'Chains',              description: 'Gold and silver chains',                isActive: true },
  { id: 'cat-007', name: 'Anklets',             description: 'Traditional and designer anklets',      isActive: true },
  { id: 'cat-008', name: 'Nose Pins',           description: 'Diamond and gold nose pins',            isActive: true },
  { id: 'cat-009', name: 'Mangalsutra',         description: 'Traditional wedding jewellery',         isActive: true },
  { id: 'cat-010', name: 'Sets',                description: 'Complete jewellery sets',               isActive: true },
  { id: 'cat-011', name: "Men's Jewellery",     description: 'Rings, chains and bracelets for men',   isActive: true },
  { id: 'cat-012', name: 'Silver Items',        description: 'Silver jewellery and articles',         isActive: true },
  { id: 'cat-013', name: 'Coins & Bars',        description: 'Gold and silver coins and bars',        isActive: true },
  { id: 'cat-014', name: 'Watches',             description: 'Luxury watches',                       isActive: true },
];

// ==========================================
// Gold Type Configurations
// ==========================================

export const seedGoldTypes: GoldTypeInsert[] = [
  { id: 'gold-24k', karat: '24K', purityPercentage: '99.90', description: 'Pure gold - too soft for jewellery, used for coins & bars', isActive: true,  defaultWastagePercentage: '5.00',  color: '#FFD700' },
  { id: 'gold-22k', karat: '22K', purityPercentage: '91.67', description: 'Most popular for traditional Sri Lankan jewellery',         isActive: true,  defaultWastagePercentage: '8.00',  color: '#FFC125' },
  { id: 'gold-21k', karat: '21K', purityPercentage: '87.50', description: 'Popular in Middle Eastern jewellery',                       isActive: true,  defaultWastagePercentage: '8.00',  color: '#FFB347' },
  { id: 'gold-18k', karat: '18K', purityPercentage: '75.00', description: 'Ideal for gemstone settings & designer pieces',             isActive: true,  defaultWastagePercentage: '10.00', color: '#DAA520' },
  { id: 'gold-14k', karat: '14K', purityPercentage: '58.30', description: 'Durable for everyday wear',                                 isActive: true,  defaultWastagePercentage: '10.00', color: '#CD853F' },
  { id: 'gold-10k', karat: '10K', purityPercentage: '41.70', description: 'Most durable, affordable gold option',                      isActive: false, defaultWastagePercentage: '12.00', color: '#B8860B' },
  { id: 'gold-9k',  karat: '9K',  purityPercentage: '37.50', description: 'Entry-level gold jewellery',                                isActive: false, defaultWastagePercentage: '12.00', color: '#A0522D' },
];

// ==========================================
// Gold Rates (per gram, LKR)
// ==========================================

export const seedGoldRates: GoldRateInsert[] = [
  { id: 'rate-24k', karat: '24K', buyingRate: '28500.00', sellingRate: '29000.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-22k', karat: '22K', buyingRate: '26100.00', sellingRate: '26600.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-21k', karat: '21K', buyingRate: '24900.00', sellingRate: '25400.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-18k', karat: '18K', buyingRate: '21400.00', sellingRate: '21900.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-14k', karat: '14K', buyingRate: '16600.00', sellingRate: '17100.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-10k', karat: '10K', buyingRate: '11900.00', sellingRate: '12400.00', date: '2024-12-31', updatedBy: 'system' },
  { id: 'rate-9k',  karat: '9K',  buyingRate: '10700.00', sellingRate: '11200.00', date: '2024-12-31', updatedBy: 'system' },
];

// ==========================================
// Products — 10 jewellery items
// ==========================================

export const seedProducts: ProductInsert[] = [
  {
    id: 'prod-001', sku: 'RG-NL-22K-001', name: '22K Gold Traditional Necklace',
    description: 'Handcrafted traditional Sri Lankan necklace with intricate floral design',
    categoryId: 'cat-001', metalType: 'gold', karat: '22K',
    metalWeight: '35.500', metalPurity: '91.67',
    hasGemstones: false,
    metalRate: '18500.00', makingCharges: '45000.00',
    sellingPrice: '702250.00', costPrice: '620000.00',
    stockQuantity: 3, reorderLevel: 2,
    supplierId: 'sup-001', supplierName: 'Lanka Gold Suppliers',
    dateAdded: new Date('2024-01-15'),
  },
  {
    id: 'prod-002', sku: 'RG-ER-18K-002', name: '18K Gold Diamond Earrings',
    description: 'Elegant diamond stud earrings set in 18K gold, perfect for formal occasions',
    categoryId: 'cat-002', metalType: 'gold', karat: '18K',
    metalWeight: '8.200', metalPurity: '75.00',
    hasGemstones: true, totalGemstoneWeight: '1.000',
    metalRate: '14000.00', makingCharges: '25000.00',
    gemstoneValue: '150000.00',
    sellingPrice: '289800.00', costPrice: '245000.00',
    stockQuantity: 5, reorderLevel: 2,
    supplierId: 'sup-002', supplierName: 'Ratnapura Gem Traders',
    dateAdded: new Date('2024-02-20'),
  },
  {
    id: 'prod-003', sku: 'RG-RG-18K-003', name: '18K White Gold Solitaire Ring',
    description: 'Stunning solitaire diamond ring in white gold setting',
    categoryId: 'cat-003', metalType: 'white-gold', karat: '18K',
    metalWeight: '5.500', metalPurity: '75.00',
    hasGemstones: true, totalGemstoneWeight: '1.000',
    metalRate: '14500.00', makingCharges: '35000.00',
    gemstoneValue: '350000.00',
    sellingPrice: '464750.00', costPrice: '395000.00',
    stockQuantity: 2, reorderLevel: 1,
    supplierId: 'sup-002', supplierName: 'Ratnapura Gem Traders',
    dateAdded: new Date('2024-03-10'),
  },
  {
    id: 'prod-004', sku: 'RG-BG-22K-004', name: '22K Gold Bangles Set (6 pcs)',
    description: 'Set of 6 traditional gold bangles with embossed patterns',
    categoryId: 'cat-004', metalType: 'gold', karat: '22K',
    metalWeight: '72.000', metalPurity: '91.67',
    hasGemstones: false,
    metalRate: '18500.00', makingCharges: '65000.00',
    sellingPrice: '1397000.00', costPrice: '1250000.00',
    stockQuantity: 4, reorderLevel: 2,
    supplierId: 'sup-001', supplierName: 'Lanka Gold Suppliers',
    dateAdded: new Date('2024-04-05'),
  },
  {
    id: 'prod-005', sku: 'RG-PD-22K-005', name: '22K Gold Ruby Pendant',
    description: 'Beautiful ruby pendant set in 22K gold with filigree work',
    categoryId: 'cat-005', metalType: 'gold', karat: '22K',
    metalWeight: '12.500', metalPurity: '91.67',
    hasGemstones: true, totalGemstoneWeight: '2.500',
    metalRate: '18500.00', makingCharges: '28000.00',
    gemstoneValue: '180000.00',
    sellingPrice: '439250.00', costPrice: '375000.00',
    stockQuantity: 3, reorderLevel: 1,
    supplierId: 'sup-003', supplierName: 'Colombo Jewellery Wholesale',
    dateAdded: new Date('2024-05-12'),
  },
  {
    id: 'prod-006', sku: 'RG-CH-22K-006', name: '22K Gold Rope Chain 24"',
    description: 'Classic rope pattern gold chain, 24 inches length',
    categoryId: 'cat-006', metalType: 'gold', karat: '22K',
    metalWeight: '25.000', metalPurity: '91.67',
    hasGemstones: false,
    metalRate: '18500.00', makingCharges: '15000.00',
    sellingPrice: '477500.00', costPrice: '420000.00',
    stockQuantity: 8, reorderLevel: 3,
    supplierId: 'sup-001', supplierName: 'Lanka Gold Suppliers',
    dateAdded: new Date('2024-06-01'),
  },
  {
    id: 'prod-007', sku: 'RG-MR-22K-007', name: '22K Gold Men\'s Ring',
    description: 'Classic men\'s gold ring with matte finish',
    categoryId: 'cat-011', metalType: 'gold', karat: '22K',
    metalWeight: '15.000', metalPurity: '91.67',
    hasGemstones: false,
    metalRate: '18500.00', makingCharges: '12000.00',
    sellingPrice: '289500.00', costPrice: '255000.00',
    stockQuantity: 6, reorderLevel: 2,
    supplierId: 'sup-001', supplierName: 'Lanka Gold Suppliers',
    dateAdded: new Date('2024-07-15'),
  },
  {
    id: 'prod-008', sku: 'RG-CB-24K-008', name: '24K Gold Bar 100g',
    description: '100 gram 24K pure gold bar, hallmarked and certified',
    categoryId: 'cat-013', metalType: 'gold', karat: '24K',
    metalWeight: '100.000', metalPurity: '99.99',
    hasGemstones: false,
    metalRate: '19500.00', makingCharges: '0.00',
    sellingPrice: '1950000.00', costPrice: '1900000.00',
    stockQuantity: 10, reorderLevel: 5,
    supplierId: 'sup-004', supplierName: 'International Gold Corp',
    dateAdded: new Date('2024-08-01'),
  },
  {
    id: 'prod-009', sku: 'RG-SL-925-009', name: '925 Silver Anklet Pair',
    description: 'Traditional silver anklets with bell charms',
    categoryId: 'cat-012', metalType: 'silver',
    metalWeight: '85.000', metalPurity: '92.50',
    hasGemstones: false,
    metalRate: '120.00', makingCharges: '2500.00',
    sellingPrice: '12700.00', costPrice: '10500.00',
    stockQuantity: 15, reorderLevel: 5,
    supplierId: 'sup-003', supplierName: 'Colombo Jewellery Wholesale',
    dateAdded: new Date('2024-09-10'),
  },
  {
    id: 'prod-010', sku: 'RG-ER-RG-010', name: '18K Rose Gold Hoop Earrings',
    description: 'Modern rose gold hoop earrings with brushed finish',
    categoryId: 'cat-002', metalType: 'rose-gold', karat: '18K',
    metalWeight: '6.800', metalPurity: '75.00',
    hasGemstones: false,
    metalRate: '15000.00', makingCharges: '18000.00',
    sellingPrice: '120000.00', costPrice: '98000.00',
    stockQuantity: 4, reorderLevel: 2,
    supplierId: 'sup-004', supplierName: 'International Gold Corp',
    dateAdded: new Date('2024-10-20'),
  },
];

// ==========================================
// Gemstones for products that have them
// ==========================================

export const seedGemstones: GemstoneInsert[] = [
  // prod-002: 18K Gold Diamond Earrings
  { id: 'gem-001', productId: 'prod-002', name: 'Diamond', type: 'diamond', carat: '0.500', clarity: 'VVS1', cut: 'Excellent', color: 'D', certified: true, certificateNumber: 'GIA-12345' },
  { id: 'gem-002', productId: 'prod-002', name: 'Diamond', type: 'diamond', carat: '0.500', clarity: 'VVS1', cut: 'Excellent', color: 'D', certified: true, certificateNumber: 'GIA-12346' },

  // prod-003: 18K White Gold Solitaire Ring
  { id: 'gem-003', productId: 'prod-003', name: 'Diamond', type: 'diamond', carat: '1.000', clarity: 'VS1', cut: 'Ideal', color: 'E', certified: true, certificateNumber: 'GIA-12347' },

  // prod-005: 22K Gold Ruby Pendant
  { id: 'gem-004', productId: 'prod-005', name: 'Ruby', type: 'ruby', carat: '2.500', clarity: 'Eye Clean', color: 'Pigeon Blood', origin: 'Myanmar', certified: true, certificateNumber: 'GRS-78901' },
];
