import express from 'express';
import cors from 'cors';
import orderDetailRoutes from './routes/orderDetails';
import distributorRoutes from './routes/distributors';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/distributors', distributorRoutes);
app.use('/api/order-details', orderDetailRoutes);

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─── Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);

export default app;
