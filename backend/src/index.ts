import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import goldRoutes from './routes/gold.js';
import companyRoutes from './routes/company.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ==========================================
// Middleware
// ==========================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
