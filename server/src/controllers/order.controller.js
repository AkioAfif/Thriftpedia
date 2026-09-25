const orderService = require('../services/order.service');

async function create(req, res) {
  const order = await orderService.createOrder({
    buyerId: req.user.id,            // from JWT, never from body
    productId: req.body.productId,   // the ONLY field read from body
  });
  res.status(201).json({ message: 'Order created', data: order });
}

module.exports = { create };
