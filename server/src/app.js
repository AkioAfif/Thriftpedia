const express = require('express');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
// other modules mount their routers here

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
