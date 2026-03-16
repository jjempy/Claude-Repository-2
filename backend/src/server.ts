import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import actionRoutes from './routes/actions';
import analyticsRoutes from './routes/analytics';
import machineRoutes from './routes/machines';
import facilityRoutes from './routes/facilities';
import attachmentRoutes from './routes/attachments';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Routes
app.use('/auth', authRoutes);
app.use('/problems', problemRoutes);
app.use('/actions', actionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/machines', machineRoutes);
app.use('/facilities', facilityRoutes);
app.use('/attachments', attachmentRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LeanShop RCA Backend running on port ${PORT}`);
});

export default app;
