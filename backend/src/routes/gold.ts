import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { goldRates, goldTypeConfigs } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Gold Rates
// ==========================================

// GET /api/gold/rates — List all current rates
router.get('/rates', async (_req, res, next) => {
  try {
    const rates = await db.select().from(goldRates);
    res.json({ status: 'success', data: rates });
  } catch (err) {
    next(err);
  }
});

// PUT /api/gold/rates/:id — Update a rate
router.put('/rates/:id', async (req, res, next) => {
  try {
    const parsed = z.object({
      buyingRate: z.string(),
      sellingRate: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      updatedBy: z.string().optional(),
    }).parse(req.body);

    const [updated] = await db
      .update(goldRates)
      .set(parsed)
      .where(eq(goldRates.id, req.params.id))
      .returning();
    if (!updated) throw new AppError(404, 'Gold rate not found');
    res.json({ status: 'success', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// Gold Type Configs
// ==========================================

// GET /api/gold/types — List all gold types
router.get('/types', async (_req, res, next) => {
  try {
    const types = await db.select().from(goldTypeConfigs);
    res.json({ status: 'success', data: types });
  } catch (err) {
    next(err);
  }
});

// PUT /api/gold/types/:id — Update a gold type config
router.put('/types/:id', async (req, res, next) => {
  try {
    const parsed = z.object({
      purityPercentage: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      defaultWastagePercentage: z.string().optional(),
      color: z.string().max(20).optional(),
    }).parse(req.body);

    const [updated] = await db
      .update(goldTypeConfigs)
      .set(parsed)
      .where(eq(goldTypeConfigs.id, req.params.id))
      .returning();
    if (!updated) throw new AppError(404, 'Gold type config not found');
    res.json({ status: 'success', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

export default router;
