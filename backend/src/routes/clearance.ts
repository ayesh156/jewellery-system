import { Router } from 'express';
import { eq, ilike, or, sql, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { clearances, clearanceItems, clearancePayments, customers } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const clearanceItemSchema = z.object({
  id: z.string().min(1).max(50),
  productId: z.string().max(50).nullish(),
  sku: z.string().max(50).nullish(),
  productName: z.string().min(1).max(200),
  description: z.string().nullish(),
  metalType: z.enum(['gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold']).nullish(),
  karat: z.enum(['24K', '22K', '21K', '18K', '14K', '10K', '9K']).nullish(),
  metalWeight: z.string().nullish(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.string(),
  originalPrice: z.string().nullish(),
  discount: z.string().nullish(),
  discountType: z.string().max(20).nullish(),
  total: z.string(),
});

const createClearanceSchema = z.object({
  id: z.string().min(1).max(50),
  clearanceNumber: z.string().min(1).max(50),
  customerId: z.string().min(1).max(50),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(20).nullish(),
  customerAddress: z.string().max(300).nullish(),
  items: z.array(clearanceItemSchema).min(1),
  subtotal: z.string(),
  discount: z.string().default('0'),
  discountType: z.string().max(20).nullish(),
  tax: z.string().default('0'),
  taxRate: z.string().nullish(),
  total: z.string(),
  amountPaid: z.string().default('0'),
  balanceDue: z.string().default('0'),
  paymentMethod: z.enum(['cash', 'card', 'bank-transfer', 'cheque', 'credit', 'upi', 'other']).nullish(),
  issueDate: z.string().max(10),
  dueDate: z.string().max(10).nullish(),
  status: z.enum(['draft', 'pending', 'paid', 'partial', 'cancelled', 'refunded']).default('draft'),
  clearanceReason: z.string().nullish(),
  notes: z.string().nullish(),
  createdBy: z.string().max(100).nullish(),
  createdByUserId: z.string().max(50).nullish(),
});

const paymentSchema = z.object({
  id: z.string().min(1).max(50),
  amount: z.string(),
  method: z.enum(['cash', 'card', 'bank-transfer', 'cheque', 'credit', 'upi', 'other']),
  date: z.string().max(10),
  reference: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});

// ==========================================
// GET /api/clearance — List with search, filter, pagination
// ==========================================

router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(clearances.clearanceNumber, `%${search}%`),
          ilike(clearances.customerName, `%${search}%`),
        )
      );
    }
    if (status) conditions.push(eq(clearances.status, status as any));

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    const sortColumn = clearances[sortBy as keyof typeof clearances] || clearances.createdAt;
    const orderBy = sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const [allClearances, [{ count }]] = await Promise.all([
      db.select().from(clearances).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(clearances).where(where),
    ]);

    // Fetch items for each clearance
    const clearanceIds = allClearances.map(c => c.id);
    const allItems = clearanceIds.length > 0
      ? await db.select().from(clearanceItems)
          .where(sql`${clearanceItems.clearanceId} IN ${clearanceIds}`)
      : [];

    const itemsByClearance = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const existing = itemsByClearance.get(item.clearanceId) || [];
      existing.push(item);
      itemsByClearance.set(item.clearanceId, existing);
    }

    res.json({
      status: 'success',
      data: allClearances.map(c => ({
        ...c,
        items: itemsByClearance.get(c.id) || [],
      })),
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
// GET /api/clearance/:id — Get clearance with items & payments
// ==========================================

router.get('/:id', async (req, res, next) => {
  try {
    const [clearance] = await db.select().from(clearances).where(eq(clearances.id, req.params.id));
    if (!clearance) throw new AppError(404, 'Clearance not found');

    const [items, clrPayments] = await Promise.all([
      db.select().from(clearanceItems).where(eq(clearanceItems.clearanceId, req.params.id)),
      db.select().from(clearancePayments).where(eq(clearancePayments.clearanceId, req.params.id)),
    ]);

    res.json({
      status: 'success',
      data: { ...clearance, items, payments: clrPayments },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/clearance — Create clearance with items
// ==========================================

router.post('/', async (req, res, next) => {
  try {
    const parsed = createClearanceSchema.parse(req.body);
    const { items, ...clearanceData } = parsed;

    // Verify customer exists
    const [customer] = await db.select().from(customers).where(eq(customers.id, parsed.customerId));
    if (!customer) throw new AppError(400, 'Customer not found');

    // Insert clearance
    const [created] = await db.insert(clearances).values({
      ...clearanceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Insert items
    await db.insert(clearanceItems).values(
      items.map(item => ({ ...item, clearanceId: created.id }))
    );

    // If there's a payment, record it
    if (parseFloat(parsed.amountPaid) > 0 && parsed.paymentMethod) {
      await db.insert(clearancePayments).values({
        id: `cpay-${Date.now()}`,
        clearanceId: created.id,
        amount: parsed.amountPaid,
        method: parsed.paymentMethod,
        date: parsed.issueDate,
        notes: 'Initial payment',
      });
    }

    const createdItems = await db.select().from(clearanceItems).where(eq(clearanceItems.clearanceId, created.id));

    res.status(201).json({
      status: 'success',
      data: { ...created, items: createdItems },
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
// PUT /api/clearance/:id — Update clearance
// ==========================================

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = createClearanceSchema.partial().omit({ id: true }).parse(req.body);
    const { items, ...clearanceData } = parsed;

    const [updated] = await db
      .update(clearances)
      .set({ ...clearanceData, updatedAt: new Date() })
      .where(eq(clearances.id, req.params.id))
      .returning();

    if (!updated) throw new AppError(404, 'Clearance not found');

    // Replace items if provided
    if (items) {
      await db.delete(clearanceItems).where(eq(clearanceItems.clearanceId, req.params.id));
      if (items.length) {
        await db.insert(clearanceItems).values(
          items.map(item => ({ ...item, clearanceId: req.params.id }))
        );
      }
    }

    const updatedItems = await db.select().from(clearanceItems).where(eq(clearanceItems.clearanceId, req.params.id));

    res.json({ status: 'success', data: { ...updated, items: updatedItems } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// POST /api/clearance/:id/payments — Record a payment
// ==========================================

router.post('/:id/payments', async (req, res, next) => {
  try {
    const parsed = paymentSchema.parse(req.body);

    const [clearance] = await db.select().from(clearances).where(eq(clearances.id, req.params.id));
    if (!clearance) throw new AppError(404, 'Clearance not found');

    // Insert payment
    const [payment] = await db.insert(clearancePayments).values({
      ...parsed,
      clearanceId: req.params.id,
      createdAt: new Date(),
    }).returning();

    // Update clearance totals
    const newAmountPaid = parseFloat(clearance.amountPaid) + parseFloat(parsed.amount);
    const newBalanceDue = parseFloat(clearance.total) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

    const [updatedClearance] = await db
      .update(clearances)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        balanceDue: Math.max(0, newBalanceDue).toFixed(2),
        status: newStatus,
        paymentMethod: parsed.method,
        updatedAt: new Date(),
      })
      .where(eq(clearances.id, req.params.id))
      .returning();

    res.status(201).json({
      status: 'success',
      data: { payment, clearance: updatedClearance },
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
// DELETE /api/clearance/:id — Delete clearance + items + payments
// ==========================================

router.delete('/:id', async (req, res, next) => {
  try {
    const [deleted] = await db.delete(clearances).where(eq(clearances.id, req.params.id)).returning();
    if (!deleted) throw new AppError(404, 'Clearance not found');
    res.json({ status: 'success', data: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
