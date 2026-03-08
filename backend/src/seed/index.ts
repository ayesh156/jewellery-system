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
  await db.delete(schema.productGemstones);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.goldRates);
  await db.delete(schema.goldTypeConfigs);
  await db.delete(schema.companyInfo);
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

  // Verify counts
  const [{ count: catCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.categories);
  const [{ count: prodCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.products);
  const [{ count: gemCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.productGemstones);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete!');
  console.log(`   Categories:  ${catCount}`);
  console.log(`   Products:    ${prodCount}`);
  console.log(`   Gemstones:   ${gemCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
