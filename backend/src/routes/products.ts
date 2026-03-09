import { Router } from 'express';
import { eq, ilike, or, sql, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { products, productGemstones, categories } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const gemstoneSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  type: z.enum(['diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'topaz', 'amethyst', 'opal', 'other']),
  carat: z.string().optional(),
  clarity: z.string().max(50).optional(),
  cut: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  origin: z.string().max(100).optional(),
  certified: z.boolean().default(false),
  certificateNumber: z.string().max(100).optional(),
});

const createProductSchema = z.object({
  id: z.string().min(1).max(50),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(100).nullish(),
  name: z.string().min(1).max(200),
  description: z.string().nullish(),
  categoryId: z.string().min(1).max(50),
  metalType: z.enum(['gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold']),
  karat: z.enum(['24K', '22K', '21K', '18K', '14K', '10K', '9K']).nullish(),
  metalWeight: z.string(),
  metalPurity: z.string().nullish(),
  hasGemstones: z.boolean().default(false),
  totalGemstoneWeight: z.string().nullish(),
  metalRate: z.string(),
  makingCharges: z.string(),
  gemstoneValue: z.string().nullish(),
  otherCharges: z.string().nullish(),
  sellingPrice: z.string(),
  costPrice: z.string(),
  stockQuantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).nullish(),
  images: z.array(z.string()).nullish(),
  supplierId: z.string().max(50).nullish(),
  supplierName: z.string().max(200).nullish(),
  isActive: z.boolean().default(true),
  gemstones: z.array(gemstoneSchema).nullish(),
});

const updateProductSchema = createProductSchema.partial().omit({ id: true });

// ==========================================
// GET /api/products/counts — Product counts by category and karat
// ==========================================

router.get('/counts', async (_req, res, next) => {
  try {
    const byCategory = await db
      .select({ categoryId: products.categoryId, count: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.categoryId);

    const byKarat = await db
      .select({ karat: products.karat, count: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.karat);

    const categoryMap: Record<string, number> = {};
    for (const row of byCategory) {
      categoryMap[row.categoryId] = row.count;
    }

    const karatMap: Record<string, number> = {};
    for (const row of byKarat) {
      if (row.karat) karatMap[row.karat] = row.count;
    }

    res.json({ status: 'success', data: { byCategory: categoryMap, byKarat: karatMap } });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET /api/products — List with search, filter, pagination
// ==========================================

router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      categoryId,
      metalType,
      karat,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
        )
      );
    }
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (metalType) conditions.push(eq(products.metalType, metalType as any));
    if (karat) conditions.push(eq(products.karat, karat as any));
    if (isActive !== undefined) conditions.push(eq(products.isActive, isActive === 'true'));

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    // Sort
    const sortColumn = products[sortBy as keyof typeof products] || products.name;
    const orderBy = sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    // Query
    const [allProducts, [{ count }]] = await Promise.all([
      db.select({
        product: products,
        categoryName: categories.name,
      })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(products).where(where),
    ]);

    res.json({
      status: 'success',
      data: allProducts.map(({ product, categoryName }) => ({
        ...product,
        categoryName,
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
// GET /api/products/:id — Get product with gemstones
// ==========================================

router.get('/:id', async (req, res, next) => {
  try {
    const [product] = await db
      .select({
        product: products,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, req.params.id));

    if (!product) throw new AppError(404, 'Product not found');

    const gemstones = await db
      .select()
      .from(productGemstones)
      .where(eq(productGemstones.productId, req.params.id));

    res.json({
      status: 'success',
      data: {
        ...product.product,
        categoryName: product.categoryName,
        gemstones,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/products — Create product with gemstones
// ==========================================

router.post('/', async (req, res, next) => {
  try {
    const parsed = createProductSchema.parse(req.body);
    const { gemstones: gemstonesData, ...productData } = parsed;

    // Verify category exists
    const [category] = await db.select().from(categories).where(eq(categories.id, parsed.categoryId));
    if (!category) throw new AppError(400, 'Category not found');

    // Insert product
    const [created] = await db.insert(products).values({
      ...productData,
      dateAdded: new Date(),
      lastUpdated: new Date(),
    }).returning();

    // Insert gemstones if any
    if (gemstonesData?.length) {
      await db.insert(productGemstones).values(
        gemstonesData.map((g) => ({ ...g, productId: created.id }))
      );
    }

    // Fetch gemstones back
    const gemstones = gemstonesData?.length
      ? await db.select().from(productGemstones).where(eq(productGemstones.productId, created.id))
      : [];

    res.status(201).json({
      status: 'success',
      data: { ...created, categoryName: category.name, gemstones },
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
// PUT /api/products/:id — Update product
// ==========================================

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateProductSchema.parse(req.body);
    const { gemstones: gemstonesData, ...productData } = parsed;

    // If categoryId changing, verify it exists
    if (parsed.categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, parsed.categoryId));
      if (!category) throw new AppError(400, 'Category not found');
    }

    const [updated] = await db
      .update(products)
      .set({ ...productData, lastUpdated: new Date() })
      .where(eq(products.id, req.params.id))
      .returning();

    if (!updated) throw new AppError(404, 'Product not found');

    // Replace gemstones if provided
    if (gemstonesData) {
      await db.delete(productGemstones).where(eq(productGemstones.productId, req.params.id));
      if (gemstonesData.length) {
        await db.insert(productGemstones).values(
          gemstonesData.map((g) => ({ ...g, productId: req.params.id }))
        );
      }
    }

    const gemstones = await db
      .select()
      .from(productGemstones)
      .where(eq(productGemstones.productId, req.params.id));

    res.json({ status: 'success', data: { ...updated, gemstones } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: err.errors });
      return;
    }
    next(err);
  }
});

// ==========================================
// DELETE /api/products/:id — Delete product + gemstones
// ==========================================

router.delete('/:id', async (req, res, next) => {
  try {
    const [deleted] = await db.delete(products).where(eq(products.id, req.params.id)).returning();
    if (!deleted) throw new AppError(404, 'Product not found');
    res.json({ status: 'success', data: deleted });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// PATCH /api/products/:id/stock — Update stock quantity
// ==========================================

router.patch('/:id/stock', async (req, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
    const [updated] = await db
      .update(products)
      .set({ stockQuantity: quantity, lastUpdated: new Date() })
      .where(eq(products.id, req.params.id))
      .returning();
    if (!updated) throw new AppError(404, 'Product not found');
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
