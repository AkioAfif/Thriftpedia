const express = require('express');
const orderRoutes = require('./routes/order.routes');

const productRoutes = require('./routes/product.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/orders', orderRoutes);

app.use('/api/products', productRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
