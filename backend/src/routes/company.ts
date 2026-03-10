import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { companyInfo } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/company — Get company info
router.get('/', async (_req, res, next) => {
  try {
    const [company] = await db.select().from(companyInfo).where(eq(companyInfo.id, 'default'));
    if (!company) throw new AppError(404, 'Company info not found');
    res.json({ status: 'success', data: company });
  } catch (err) {
    next(err);
  }
});

// PUT /api/company — Update company info
router.put('/', async (req, res, next) => {
  try {
    const parsed = z.object({
      name: z.string().min(1).max(200).optional(),
      tagline: z.string().max(300).optional(),
      logo: z.string().optional(),
      address: z.string().min(1).max(300).optional(),
      city: z.string().min(1).max(100).optional(),
      country: z.string().min(1).max(100).optional(),
      phone: z.string().min(1).max(20).optional(),
      phone2: z.string().max(20).optional(),
      email: z.string().email().max(200).optional(),
      website: z.string().max(200).optional(),
      registrationNumber: z.string().max(50).optional(),
      taxNumber: z.string().max(50).optional(),
      defaultTaxRate: z.string().max(10).optional(),
      currency: z.string().max(10).optional(),
      invoiceTerms: z.string().max(2000).optional().nullable(),
      clearanceTerms: z.string().max(2000).optional().nullable(),
    }).parse(req.body);

    const [updated] = await db
      .update(companyInfo)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(companyInfo.id, 'default'))
      .returning();
    if (!updated) throw new AppError(404, 'Company info not found');
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
