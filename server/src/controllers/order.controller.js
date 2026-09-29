const orderService = require('../services/order.service');

async function create(req, res) {
  const order = await orderService.createOrder({
    buyerId: req.user.id,            // from JWT, never from body
    productId: req.body.productId,   // the ONLY field read from body
  });
  res.status(201).json({ message: 'Order created', data: order });
}

async function list(req, res) {
  const orders = await orderService.listOrders(req.user, { status: req.query.status });
  res.status(200).json({ message: 'Orders retrieved', data: orders });
}

async function getById(req, res) {
  const order = await orderService.getOrderById(req.user, req.params.orderId);
  res.status(200).json({ message: 'Order retrieved', data: order });
}

async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
  res.status(200).json({ message: 'Order status updated', data: order });
}

module.exports = { create, list, getById, updateStatus };
