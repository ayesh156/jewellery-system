import { Router } from 'express';
import { eq, like, or, sql, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { customers } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const createCustomerSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  businessName: z.string().max(200).nullish(),
  email: z.string().max(200).nullish(),
  phone: z.string().min(1).max(20),
  phone2: z.string().max(20).nullish(),
  nic: z.string().max(20).nullish(),
  address: z.string().max(300).nullish(),
  city: z.string().max(100).nullish(),
  photo: z.string().nullish(),
  registrationDate: z.string().max(10),
  totalPurchased: z.string().default('0'),
  customerType: z.enum(['retail', 'wholesale', 'vip', 'credit']).default('retail'),
  isActive: z.boolean().default(true),
  creditLimit: z.string().nullish(),
  creditBalance: z.string().nullish(),
});

const updateCustomerSchema = createCustomerSchema.partial().omit({ id: true });

// ==========================================
// GET /api/customers — List with search & pagination
// ==========================================

router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      customerType,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`),
        )
      );
    }
    if (customerType) conditions.push(eq(customers.customerType, customerType as any));
    if (isActive !== undefined) conditions.push(eq(customers.isActive, isActive === 'true'));

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    const sortColumn = customers[sortBy as keyof typeof customers] || customers.name;
    const orderBy = sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const [allCustomers, [{ count }]] = await Promise.all([
      db.select().from(customers).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(where),
    ]);

    res.json({
      status: 'success',
      data: allCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET /api/customers/:id
// ==========================================

router.get('/:id', async (req, res, next) => {
  try {
    const [customer] = await db.select().from(customers).where(eq(customers.id, req.params.id));
    if (!customer) throw new AppError(404, 'Customer not found');
    res.json({ status: 'success', data: customer });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/customers
// ==========================================

router.post('/', async (req, res, next) => {
  try {
    const parsed = createCustomerSchema.parse(req.body);
    await db.insert(customers).values({
      ...parsed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const [created] = await db.select().from(customers).where(eq(customers.id, parsed.id));
    res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// PUT /api/customers/:id
// ==========================================

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateCustomerSchema.parse(req.body);
    const result = await db
      .update(customers)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(customers.id, req.params.id));
    if ((result as any).affectedRows === 0) throw new AppError(404, 'Customer not found');
    const [updated] = await db.select().from(customers).where(eq(customers.id, req.params.id));
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
// DELETE /api/customers/:id
// ==========================================

router.delete('/:id', async (req, res, next) => {
  try {
    const [customer] = await db.select().from(customers).where(eq(customers.id, req.params.id));
    if (!customer) throw new AppError(404, 'Customer not found');
    await db.delete(customers).where(eq(customers.id, req.params.id));
    res.json({ status: 'success', data: customer });
  } catch (err) {
    next(err);
  }
});

export default router;
