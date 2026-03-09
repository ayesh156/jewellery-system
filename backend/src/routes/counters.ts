import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { counters } from '../db/schema.js';

const router = Router();

// Default prefixes for each entity type
const DEFAULT_PREFIXES: Record<string, string> = {
  invoice: 'INV',
  clearance: 'CLR',
  product: 'PROD',
  category: 'CAT',
  customer: 'CUS',
};

const ENTITY_TYPES = Object.keys(DEFAULT_PREFIXES);

// ==========================================
// GET /api/counters?shopCode=A — List counters for a shop
// ==========================================

router.get('/', async (req, res, next) => {
  try {
    const { shopCode } = req.query as { shopCode?: string };
    const conditions = shopCode ? eq(counters.shopCode, shopCode) : undefined;
    const allCounters = await db.select().from(counters).where(conditions);

    const data = allCounters.map((c) => ({
      ...c,
      nextNumber: c.lastNumber + 1,
      nextFormatted: `${c.shopCode}${(c.lastNumber + 1).toString().padStart(c.paddingLength, '0')}`,
    }));

    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/counters/next — Atomically get next number
// Body: { entityType: 'invoice', shopCode: 'A' }
// Auto-creates counter if it doesn't exist for this shop
// Uses UPDATE ... SET last_number = last_number + 1 RETURNING
// Safe for concurrent access — PostgreSQL guarantees atomicity
// ==========================================

const nextSchema = z.object({
  entityType: z.string().min(1).max(50),
  shopCode: z.string().min(1).max(10).toUpperCase(),
});

router.post('/next', async (req, res, next) => {
  try {
    const { entityType, shopCode } = nextSchema.parse(req.body);

    // Try atomic increment
    const [updated] = await db
      .update(counters)
      .set({ lastNumber: sql`${counters.lastNumber} + 1` })
      .where(and(eq(counters.entityType, entityType), eq(counters.shopCode, shopCode)))
      .returning();

    if (updated) {
      const paddedNumber = updated.lastNumber.toString().padStart(updated.paddingLength, '0');
      const formatted = `${shopCode}${paddedNumber}`;

      return res.json({
        status: 'success',
        data: {
          entityType: updated.entityType,
          shopCode: updated.shopCode,
          prefix: updated.prefix,
          number: updated.lastNumber,
          formatted,
        },
      });
    }

    // Counter doesn't exist — auto-create with default prefix
    const prefix = DEFAULT_PREFIXES[entityType] || entityType.toUpperCase().slice(0, 4);

    const [created] = await db
      .insert(counters)
      .values({
        id: `counter-${shopCode}-${entityType}`,
        entityType,
        shopCode,
        prefix,
        lastNumber: 1,
        paddingLength: 5,
      })
      .returning();

    const paddedNumber = created.lastNumber.toString().padStart(created.paddingLength, '0');
    const formatted = `${shopCode}${paddedNumber}`;

    res.json({
      status: 'success',
      data: {
        entityType: created.entityType,
        shopCode: created.shopCode,
        prefix: created.prefix,
        number: created.lastNumber,
        formatted,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// POST /api/counters/init-shop — Initialize all counters for a shop code
// ==========================================

const initShopSchema = z.object({
  shopCode: z.string().min(1).max(10).toUpperCase(),
});

router.post('/init-shop', async (req, res, next) => {
  try {
    const { shopCode } = initShopSchema.parse(req.body);

    const existing = await db
      .select()
      .from(counters)
      .where(eq(counters.shopCode, shopCode));

    const existingTypes = new Set(existing.map((c) => c.entityType));
    const toCreate = ENTITY_TYPES.filter((t) => !existingTypes.has(t));

    if (toCreate.length > 0) {
      await db.insert(counters).values(
        toCreate.map((entityType) => ({
          id: `counter-${shopCode}-${entityType}`,
          entityType,
          shopCode,
          prefix: DEFAULT_PREFIXES[entityType],
          lastNumber: 0,
          paddingLength: 5,
        })),
      );
    }

    const allCounters = await db
      .select()
      .from(counters)
      .where(eq(counters.shopCode, shopCode));

    const data = allCounters.map((c) => ({
      ...c,
      nextNumber: c.lastNumber + 1,
      nextFormatted: `${c.shopCode}${(c.lastNumber + 1).toString().padStart(c.paddingLength, '0')}`,
    }));

    res.json({ status: 'success', data, created: toCreate.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// PUT /api/counters/:entityType — Update counter prefix for a shop
// ==========================================

const updateCounterSchema = z.object({
  shopCode: z.string().min(1).max(10).toUpperCase(),
  prefix: z.string().min(1).max(20).optional(),
  paddingLength: z.number().int().min(1).max(10).optional(),
  lastNumber: z.number().int().min(0).optional(),
});

router.put('/:entityType', async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const parsed = updateCounterSchema.parse(req.body);

    const setFields: Record<string, any> = {};
    if (parsed.prefix !== undefined) setFields.prefix = parsed.prefix;
    if (parsed.paddingLength !== undefined) setFields.paddingLength = parsed.paddingLength;
    if (parsed.lastNumber !== undefined) setFields.lastNumber = parsed.lastNumber;

    if (Object.keys(setFields).length === 0) {
      res.status(400).json({ status: 'error', message: 'No fields to update' });
      return;
    }

    const [updated] = await db
      .update(counters)
      .set(setFields)
      .where(and(eq(counters.entityType, entityType), eq(counters.shopCode, parsed.shopCode)))
      .returning();

    if (!updated) {
      res.status(404).json({ status: 'error', message: `Counter not found for ${entityType} / ${parsed.shopCode}` });
      return;
    }

    res.json({
      status: 'success',
      data: {
        ...updated,
        nextNumber: updated.lastNumber + 1,
        nextFormatted: `${updated.shopCode}${(updated.lastNumber + 1).toString().padStart(updated.paddingLength, '0')}`,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

export default router;
