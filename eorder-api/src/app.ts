import express from 'express';
import cors from 'cors';
import orderDetailRoutes from './routes/orderDetails';
import distributorRoutes from './routes/distributors';
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3002',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://172.17.253.122:5173',
  'http://172.17.253.122:3002',
  'http://172.17.253.17:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    console.log('Incoming request origin:', origin);
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://172.17.253')) {
      return callback(null, true);
    } else {
      console.warn('Origin not allowed by CORS:', origin);
      return callback(null, true); // Allow all for now but log warning to debug
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
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
