const express = require('express');
const orderRoutes = require('./routes/order.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const reviewRoutes = require('./routes/review.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);
// other modules mount their routers here

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
