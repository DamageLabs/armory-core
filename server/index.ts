import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const helmet = (await import('helmet')).default;
  const rateLimit = (await import('express-rate-limit')).default;
  const { seedDatabase } = await import('./db/seed');
  const { requireAuth, requireAdmin } = await import('./middleware/auth');
  const authRoutes = (await import('./routes/auth')).default;
  const itemRoutes = (await import('./routes/items')).default;
  const inventoryTypeRoutes = (await import('./routes/inventoryTypes')).default;
  const categoryRoutes = (await import('./routes/categories')).default;
  const stockHistoryRoutes = (await import('./routes/stockHistory')).default;
  const costHistoryRoutes = (await import('./routes/costHistory')).default;
  const templateRoutes = (await import('./routes/templates')).default;
  const bomRoutes = (await import('./routes/boms')).default;
  const userRoutes = (await import('./routes/users')).default;
  const receiptRoutes = (await import('./routes/receipts')).default;
  const auditLogRoutes = (await import('./routes/auditLog')).default;
  const savedFilterRoutes = (await import('./routes/savedFilters')).default;
  const noteRoutes = (await import('./routes/notes')).default;
  const photoRoutes = (await import('./routes/photos')).default;
  const maintenanceRoutes = (await import('./routes/maintenance')).default;

  // Seed database on startup
  await seedDatabase();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Trust proxy for correct req.ip behind reverse proxies
  app.set('trust proxy', true);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // CSP managed by frontend meta tags
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources (images, fonts)
  }));

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting — global: 100 requests per minute per IP
  app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }));

  // Stricter rate limit for auth endpoints: 10 requests per minute per IP
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  // Routes — auth is public (with stricter rate limit), everything else requires authentication
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/items', requireAuth, itemRoutes);
  // Inventory types: read-only for all authenticated users, admin-only for modifications
  app.use('/api/inventory-types', requireAuth, inventoryTypeRoutes);
  // Categories: read-only for all authenticated users, admin-only for modifications
  app.use('/api/categories', requireAuth, categoryRoutes);
  app.use('/api/stock-history', requireAuth, stockHistoryRoutes);
  app.use('/api/cost-history', requireAuth, costHistoryRoutes);
  app.use('/api/templates', requireAuth, templateRoutes);
  app.use('/api/boms', requireAuth, bomRoutes);
  app.use('/api/receipts', requireAuth, receiptRoutes);
  app.use('/api/users', requireAuth, requireAdmin, userRoutes);
  app.use('/api/saved-filters', requireAuth, savedFilterRoutes);
  app.use('/api/notes', requireAuth, noteRoutes);
  app.use('/api/photos', requireAuth, photoRoutes);
  app.use('/api/maintenance', requireAuth, maintenanceRoutes);
  app.use('/api/audit-log', requireAuth, requireAdmin, auditLogRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();
