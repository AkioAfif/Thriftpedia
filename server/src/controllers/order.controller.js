const orderService = require('../services/order.service');

async function create(req, res) {
  const order = await orderService.createOrder({
    buyerId: req.user.id,            // from JWT, never from body
    productId: req.body.productId,
    shippingAddress: req.body.shippingAddress, // optional, shape checked by validateCreateOrder
  });
  res.status(201).json({ message: 'Order created', data: order });
}

async function list(req, res) {
  const result = await orderService.listOrders(req.user, req.orderQuery); // parsed by validateListQuery
  res.status(200).json({ message: 'Orders retrieved', data: result });
}

async function getById(req, res) {
  const order = await orderService.getOrderById(req.user, req.params.orderId);
  res.status(200).json({ message: 'Order retrieved', data: order });
}

async function updateStatus(req, res) {
  const { status, trackingNumber, courier, note } = req.body; // shape checked by validateUpdateStatus
  const order = await orderService.updateOrderStatus(req.user, req.params.orderId, {
    status,
    trackingNumber,
    courier,
    note,
  });
  res.status(200).json({ message: 'Order status updated', data: order });
}

module.exports = { create, list, getById, updateStatus };
