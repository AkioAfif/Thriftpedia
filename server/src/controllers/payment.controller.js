const paymentService = require('../services/payment.service');

async function createSnapToken(req, res) {
  const { token, redirectUrl, created } = await paymentService.createSnapToken(req.user.id, req.params.orderId);
  res.status(created ? 201 : 200).json({
    message: created ? 'Payment token created' : 'Payment token retrieved',
    data: { token, redirectUrl },
  });
}

// Called by Midtrans, server to server. Any non-2xx makes Midtrans retry.
async function notification(req, res) {
  await paymentService.handleNotification(req.body);
  res.status(200).json({ message: 'OK' });
}

module.exports = { createSnapToken, notification };
