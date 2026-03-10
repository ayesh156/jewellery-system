import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import {
  seedCompanyInfo,
  seedCategories,
  seedGoldTypes,
  seedGoldRates,
  seedProducts,
  seedGemstones,
  seedCustomers,
  seedInvoices,
  seedInvoiceItems,
  seedPayments,
  seedClearances,
  seedClearanceItems,
  seedClearancePayments,
  seedCounters,
  seedUsers,
} from './data.js';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('🌱 Starting database seed...\n');

  const client = neon(databaseUrl);
  const db = drizzle(client, { schema });

  // Clear tables in reverse dependency order
  console.log('🗑️  Clearing existing data...');
  await db.delete(schema.clearancePayments);
  await db.delete(schema.clearanceItems);
  await db.delete(schema.clearances);
  await db.delete(schema.payments);
  await db.delete(schema.invoiceItems);
  await db.delete(schema.invoices);
  await db.delete(schema.customers);
  await db.delete(schema.productGemstones);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.goldRates);
  await db.delete(schema.goldTypeConfigs);
  await db.delete(schema.companyInfo);
  await db.delete(schema.counters);
  await db.delete(schema.users);
  console.log('   ✓ Tables cleared\n');

  // Seed in dependency order
  console.log('📦 Seeding company info...');
  await db.insert(schema.companyInfo).values(seedCompanyInfo);
  console.log('   ✓ 1 company record\n');

  console.log('📦 Seeding categories...');
  await db.insert(schema.categories).values(seedCategories);
  console.log(`   ✓ ${seedCategories.length} categories\n`);

  console.log('📦 Seeding gold type configs...');
  await db.insert(schema.goldTypeConfigs).values(seedGoldTypes);
  console.log(`   ✓ ${seedGoldTypes.length} gold types\n`);

  console.log('📦 Seeding gold rates...');
  await db.insert(schema.goldRates).values(seedGoldRates);
  console.log(`   ✓ ${seedGoldRates.length} gold rates\n`);

  console.log('📦 Seeding products...');
  await db.insert(schema.products).values(seedProducts);
  console.log(`   ✓ ${seedProducts.length} products\n`);

  console.log('💎 Seeding gemstones...');
  await db.insert(schema.productGemstones).values(seedGemstones);
  console.log(`   ✓ ${seedGemstones.length} gemstones\n`);

  console.log('👥 Seeding customers...');
  await db.insert(schema.customers).values(seedCustomers);
  console.log(`   ✓ ${seedCustomers.length} customers\n`);

  console.log('🧾 Seeding invoices...');
  await db.insert(schema.invoices).values(seedInvoices);
  console.log(`   ✓ ${seedInvoices.length} invoices\n`);

  console.log('📋 Seeding invoice items...');
  await db.insert(schema.invoiceItems).values(seedInvoiceItems);
  console.log(`   ✓ ${seedInvoiceItems.length} invoice items\n`);

  console.log('💳 Seeding payments...');
  await db.insert(schema.payments).values(seedPayments);
  console.log(`   ✓ ${seedPayments.length} payments\n`);

  console.log('🏷️ Seeding clearances...');
  await db.insert(schema.clearances).values(seedClearances);
  console.log(`   ✓ ${seedClearances.length} clearances\n`);

  console.log('📋 Seeding clearance items...');
  await db.insert(schema.clearanceItems).values(seedClearanceItems);
  console.log(`   ✓ ${seedClearanceItems.length} clearance items\n`);

  console.log('💳 Seeding clearance payments...');
  await db.insert(schema.clearancePayments).values(seedClearancePayments);
  console.log(`   ✓ ${seedClearancePayments.length} clearance payments\n`);

  console.log('🔢 Seeding counters...');
  await db.insert(schema.counters).values(seedCounters);
  console.log(`   ✓ ${seedCounters.length} counters\n`);

  console.log('👤 Seeding users...');
  await db.insert(schema.users).values(seedUsers);
  console.log(`   ✓ ${seedUsers.length} users\n`);

  // Verify counts
  const [{ count: catCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.categories);
  const [{ count: prodCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.products);
  const [{ count: gemCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.productGemstones);
  const [{ count: custCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.customers);
  const [{ count: invCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.invoices);
  const [{ count: itemCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.invoiceItems);
  const [{ count: payCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.payments);
  const [{ count: clrCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.clearances);
  const [{ count: clrItemCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.clearanceItems);
  const [{ count: clrPayCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.clearancePayments);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete!');
  console.log(`   Categories:       ${catCount}`);
  console.log(`   Products:         ${prodCount}`);
  console.log(`   Gemstones:        ${gemCount}`);
  console.log(`   Customers:        ${custCount}`);
  console.log(`   Invoices:         ${invCount}`);
  console.log(`   Invoice Items:    ${itemCount}`);
  console.log(`   Payments:         ${payCount}`);
  console.log(`   Clearances:       ${clrCount}`);
  console.log(`   Clearance Items:  ${clrItemCount}`);
  console.log(`   Clearance Pays:   ${clrPayCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
