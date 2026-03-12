import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
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

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  // Routes — auth is public, everything else requires authentication
  app.use('/api/auth', authRoutes);
  app.use('/api/items', requireAuth, itemRoutes);
  app.use('/api/inventory-types', requireAuth, inventoryTypeRoutes);
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
