import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import goldRoutes from './routes/gold.js';
import companyRoutes from './routes/company.js';
import customerRoutes from './routes/customers.js';
import invoiceRoutes from './routes/invoices.js';
import clearanceRoutes from './routes/clearance.js';
import counterRoutes from './routes/counters.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ==========================================
// Middleware
// ==========================================

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && origin?.startsWith('http://localhost:'))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ==========================================
// Health Check
// ==========================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// API Routes
// ==========================================

app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ==========================================
// Error Handling
// ==========================================

app.use(notFound);
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================

app.listen(PORT, () => {
  console.log(`\n🚀 Onelka Jewellery API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
