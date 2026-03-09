import { Router } from 'express';
import { eq, ilike, or, sql, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { invoices, invoiceItems, payments, customers } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const invoiceItemSchema = z.object({
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

const createInvoiceSchema = z.object({
  id: z.string().min(1).max(50),
  invoiceNumber: z.string().min(1).max(50),
  customerId: z.string().min(1).max(50),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(20).nullish(),
  customerAddress: z.string().max(300).nullish(),
  items: z.array(invoiceItemSchema).min(1),
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
// GET /api/invoices — List with search, filter, pagination
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
          ilike(invoices.invoiceNumber, `%${search}%`),
          ilike(invoices.customerName, `%${search}%`),
        )
      );
    }
    if (status) conditions.push(eq(invoices.status, status as any));

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    const sortColumn = invoices[sortBy as keyof typeof invoices] || invoices.createdAt;
    const orderBy = sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const [allInvoices, [{ count }]] = await Promise.all([
      db.select().from(invoices).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(invoices).where(where),
    ]);

    // Fetch items for each invoice
    const invoiceIds = allInvoices.map(inv => inv.id);
    const allItems = invoiceIds.length > 0
      ? await db.select().from(invoiceItems)
          .where(sql`${invoiceItems.invoiceId} IN ${invoiceIds}`)
      : [];

    const itemsByInvoice = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const existing = itemsByInvoice.get(item.invoiceId) || [];
      existing.push(item);
      itemsByInvoice.set(item.invoiceId, existing);
    }

    res.json({
      status: 'success',
      data: allInvoices.map(inv => ({
        ...inv,
        items: itemsByInvoice.get(inv.id) || [],
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
// GET /api/invoices/:id — Get invoice with items & payments
// ==========================================

router.get('/:id', async (req, res, next) => {
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
    if (!invoice) throw new AppError(404, 'Invoice not found');

    const [items, invoicePayments] = await Promise.all([
      db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, req.params.id)),
      db.select().from(payments).where(eq(payments.invoiceId, req.params.id)),
    ]);

    res.json({
      status: 'success',
      data: { ...invoice, items, payments: invoicePayments },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/invoices — Create invoice with items
// ==========================================

router.post('/', async (req, res, next) => {
  try {
    const parsed = createInvoiceSchema.parse(req.body);
    const { items, ...invoiceData } = parsed;

    // Verify customer exists
    const [customer] = await db.select().from(customers).where(eq(customers.id, parsed.customerId));
    if (!customer) throw new AppError(400, 'Customer not found');

    // Insert invoice
    const [created] = await db.insert(invoices).values({
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Insert items
    await db.insert(invoiceItems).values(
      items.map(item => ({ ...item, invoiceId: created.id }))
    );

    // If there's a payment, record it
    if (parseFloat(parsed.amountPaid) > 0 && parsed.paymentMethod) {
      await db.insert(payments).values({
        id: `pay-${Date.now()}`,
        invoiceId: created.id,
        amount: parsed.amountPaid,
        method: parsed.paymentMethod,
        date: parsed.issueDate,
        notes: 'Initial payment',
      });
    }

    const createdItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, created.id));

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
// PUT /api/invoices/:id — Update invoice
// ==========================================

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = createInvoiceSchema.partial().omit({ id: true }).parse(req.body);
    const { items, ...invoiceData } = parsed;

    const [updated] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, req.params.id))
      .returning();

    if (!updated) throw new AppError(404, 'Invoice not found');

    // Replace items if provided
    if (items) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, req.params.id));
      if (items.length) {
        await db.insert(invoiceItems).values(
          items.map(item => ({ ...item, invoiceId: req.params.id }))
        );
      }
    }

    const updatedItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, req.params.id));

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
// POST /api/invoices/:id/payments — Record a payment
// ==========================================

router.post('/:id/payments', async (req, res, next) => {
  try {
    const parsed = paymentSchema.parse(req.body);

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
    if (!invoice) throw new AppError(404, 'Invoice not found');

    // Insert payment
    const [payment] = await db.insert(payments).values({
      ...parsed,
      invoiceId: req.params.id,
      createdAt: new Date(),
    }).returning();

    // Update invoice totals
    const newAmountPaid = parseFloat(invoice.amountPaid) + parseFloat(parsed.amount);
    const newBalanceDue = parseFloat(invoice.total) - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        balanceDue: Math.max(0, newBalanceDue).toFixed(2),
        status: newStatus,
        paymentMethod: parsed.method,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, req.params.id))
      .returning();

    res.status(201).json({
      status: 'success',
      data: { payment, invoice: updatedInvoice },
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
// DELETE /api/invoices/:id — Delete invoice + items + payments
// ==========================================

router.delete('/:id', async (req, res, next) => {
  try {
    const [deleted] = await db.delete(invoices).where(eq(invoices.id, req.params.id)).returning();
    if (!deleted) throw new AppError(404, 'Invoice not found');
    res.json({ status: 'success', data: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
