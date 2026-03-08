import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().max(50).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial().omit({ id: true });

// GET /api/categories — List all categories
router.get('/', async (_req, res, next) => {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    res.json({ status: 'success', data: allCategories });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:id — Get single category
router.get('/:id', async (req, res, next) => {
  try {
    const [category] = await db.select().from(categories).where(eq(categories.id, req.params.id));
    if (!category) throw new AppError(404, 'Category not found');
    res.json({ status: 'success', data: category });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — Create category
router.post('/', async (req, res, next) => {
  try {
    const parsed = createCategorySchema.parse(req.body);
    const [created] = await db.insert(categories).values(parsed).returning();
    res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// PUT /api/categories/:id — Update category
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateCategorySchema.parse(req.body);
    const [updated] = await db
      .update(categories)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!updated) throw new AppError(404, 'Category not found');
    res.json({ status: 'success', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// DELETE /api/categories/:id — Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const [deleted] = await db.delete(categories).where(eq(categories.id, req.params.id)).returning();
    if (!deleted) throw new AppError(404, 'Category not found');
    res.json({ status: 'success', data: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
