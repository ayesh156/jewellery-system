import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, counters } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ==========================================
// GET /api/users — List all users
// ==========================================

router.get('/', async (_req, res, next) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        shopCode: users.shopCode,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json({ status: 'success', data: allUsers });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET /api/users/:id — Get single user
// ==========================================

router.get('/:id', async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        shopCode: users.shopCode,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.params.id));

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST /api/users — Create new user
// ==========================================

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, or underscores'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1).max(200),
  phone: z.string().max(20).optional(),
  role: z.enum(['admin', 'manager', 'sales', 'accountant']).default('sales'),
  shopCode: z.string().min(1).max(10).toUpperCase().default('A'),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if username exists
    const [existingUsername] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, data.username));

    if (existingUsername) {
      throw new AppError(409, 'Username already exists');
    }

    // Check if email exists
    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email));

    if (existingEmail) {
      throw new AppError(409, 'Email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Generate user ID
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const nextNum = Number(countResult.count) + 1;
    const userId = `USR-${String(nextNum).padStart(2, '0')}`;

    // Initialize counters for user's shop code
    const DEFAULT_PREFIXES: Record<string, string> = {
      invoice: 'INV',
      clearance: 'CLR',
      product: 'PROD',
      category: 'CAT',
      customer: 'CUS',
    };

    const existingCounters = await db
      .select()
      .from(counters)
      .where(eq(counters.shopCode, data.shopCode));

    const existingTypes = new Set(existingCounters.map((c) => c.entityType));
    const toCreate = Object.keys(DEFAULT_PREFIXES).filter((t) => !existingTypes.has(t));

    if (toCreate.length > 0) {
      await db.insert(counters).values(
        toCreate.map((entityType) => ({
          id: `counter-${data.shopCode}-${entityType}`,
          entityType,
          shopCode: data.shopCode,
          prefix: DEFAULT_PREFIXES[entityType],
          lastNumber: 0,
          paddingLength: 5,
        })),
      );
    }

    await db.insert(users).values({
      id: userId,
      username: data.username,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone || null,
      role: data.role,
      shopCode: data.shopCode,
    });

    const [created] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        shopCode: users.shopCode,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

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
// PUT /api/users/:id — Update user
// ==========================================

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['admin', 'manager', 'sales', 'accountant']).optional(),
  shopCode: z.string().min(1).max(10).toUpperCase().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id));

    if (!existing) {
      throw new AppError(404, 'User not found');
    }

    // Check email uniqueness if changed
    if (data.email && data.email !== existing.email) {
      const [dup] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, data.email));
      if (dup) {
        throw new AppError(409, 'Email already exists');
      }
    }

    const setFields: Record<string, any> = { updatedAt: new Date() };
    if (data.email !== undefined) setFields.email = data.email;
    if (data.fullName !== undefined) setFields.fullName = data.fullName;
    if (data.phone !== undefined) setFields.phone = data.phone;
    if (data.role !== undefined) setFields.role = data.role;
    if (data.shopCode !== undefined) setFields.shopCode = data.shopCode;
    if (data.isActive !== undefined) setFields.isActive = data.isActive;

    // Hash new password if provided
    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      setFields.passwordHash = await bcrypt.hash(data.password, salt);
    }

    // If shop code changed, auto-initialize counters
    if (data.shopCode && data.shopCode !== existing.shopCode) {
      const DEFAULT_PREFIXES: Record<string, string> = {
        invoice: 'INV',
        clearance: 'CLR',
        product: 'PROD',
        category: 'CAT',
        customer: 'CUS',
      };

      const existingCounters = await db
        .select()
        .from(counters)
        .where(eq(counters.shopCode, data.shopCode));

      const existingTypes = new Set(existingCounters.map((c) => c.entityType));
      const toCreate = Object.keys(DEFAULT_PREFIXES).filter((t) => !existingTypes.has(t));

      if (toCreate.length > 0) {
        await db.insert(counters).values(
          toCreate.map((entityType) => ({
            id: `counter-${data.shopCode}-${entityType}`,
            entityType,
            shopCode: data.shopCode!,
            prefix: DEFAULT_PREFIXES[entityType],
            lastNumber: 0,
            paddingLength: 5,
          })),
        );
      }
    }

    const result = await db
      .update(users)
      .set(setFields)
      .where(eq(users.id, req.params.id));
    if ((result as any).affectedRows === 0) throw new AppError(404, 'User not found');

    const [updated] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        shopCode: users.shopCode,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.params.id));

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
// DELETE /api/users/:id — Delete user
// ==========================================

router.delete('/:id', async (req, res, next) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id));

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Prevent deleting self
    if (req.user!.userId === req.params.id) {
      throw new AppError(400, 'Cannot delete your own account');
    }

    await db.delete(users).where(eq(users.id, req.params.id));

    res.json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
