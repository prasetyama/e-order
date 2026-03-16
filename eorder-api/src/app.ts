import express from 'express';
import cors from 'cors';
import orderDetailRoutes from './routes/orderDetails';
import distributorRoutes from './routes/distributors';
import productRoutes from './routes/products';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://172.16.60.50:5173'],
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/distributors', distributorRoutes);
app.use('/api/order-details', orderDetailRoutes);
app.use('/api/products', productRoutes);

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─── Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);


export default app;
