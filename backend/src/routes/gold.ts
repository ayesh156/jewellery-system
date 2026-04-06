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

    const result = await db
      .update(goldRates)
      .set(parsed)
      .where(eq(goldRates.id, req.params.id));
    if ((result as any).affectedRows === 0) throw new AppError(404, 'Gold rate not found');
    const [updated] = await db.select().from(goldRates).where(eq(goldRates.id, req.params.id));
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

// POST /api/gold/types — Create a gold type config
router.post('/types', async (req, res, next) => {
  try {
    const parsed = z.object({
      id: z.string().min(1).max(50),
      karat: z.enum(['24K', '22K', '21K', '18K', '14K', '10K', '9K']),
      purityPercentage: z.string(),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
      defaultWastagePercentage: z.string(),
      color: z.string().max(20).optional(),
    }).parse(req.body);

    await db.insert(goldTypeConfigs).values(parsed);
    res.status(201).json({ status: 'success', data: parsed });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
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

    const result = await db
      .update(goldTypeConfigs)
      .set(parsed)
      .where(eq(goldTypeConfigs.id, req.params.id));
    if ((result as any).affectedRows === 0) throw new AppError(404, 'Gold type config not found');
    const [updated] = await db.select().from(goldTypeConfigs).where(eq(goldTypeConfigs.id, req.params.id));
    res.json({ status: 'success', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// DELETE /api/gold/types/:id — Delete a gold type config
router.delete('/types/:id', async (req, res, next) => {
  try {
    const [typeConfig] = await db.select().from(goldTypeConfigs).where(eq(goldTypeConfigs.id, req.params.id));
    if (!typeConfig) throw new AppError(404, 'Gold type config not found');
    await db.delete(goldTypeConfigs).where(eq(goldTypeConfigs.id, req.params.id));
    res.json({ status: 'success', data: typeConfig });
  } catch (err) {
    next(err);
  }
});

export default router;
