const path = require('path');
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const dashboardRoutes = require('./routes/dashboard.routes'); // BARU
const wishlistRoutes = require('./routes/wishlist.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Number of reverse proxies in front of the app, so req.ip (and the password-reset rate
// limiter) sees the visitor's IP instead of the proxy's. Production: 2 (Vercel rewrite +
// Railway edge). Unset/0 locally, where there is no proxy.
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '', 10);
if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);

// Exact-match allowlist from CORS_ORIGINS (comma-separated). Unset means no cross-origin
// browser access; production browsers reach the API through the Vercel /api rewrite anyway.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : false,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes); // BARU
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;