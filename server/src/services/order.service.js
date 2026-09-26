const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../constants/order');

const PRODUCT_FIELDS = 'name photos size condition price status';
const BUYER_FIELDS = 'name email'; // never expose password/passwordHash

async function createOrder({ buyerId, productId }) {
  // Steps 4+5: availability check and claim in ONE atomic, conditional write.
  const claimed = await Product.findOneAndUpdate(
    { _id: productId, status: PRODUCT_STATUS.AVAILABLE },
    { $set: { status: PRODUCT_STATUS.SOLD } },
    { returnDocument: 'after', runValidators: true }
  );

  if (!claimed) {
    // Only used to pick the right error message; safe even under races.
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new AppError(404, 'Product not found');
    throw new AppError(409, 'Product has already been sold');
  }

  // Step 6: create the order. If it fails, release the claim (compensation).
  try {
    return await Order.create({
      buyer: buyerId,
      product: claimed._id,
      status: ORDER_STATUS.PENDING,
    });
  } catch (err) {
    await Product.updateOne(
      { _id: claimed._id, status: PRODUCT_STATUS.SOLD },
      { $set: { status: PRODUCT_STATUS.AVAILABLE } }
    ).catch((rollbackErr) => {
      console.error('[order] compensation failed for product', String(claimed._id), rollbackErr);
    });
    throw err;
  }
}

async function listOrders(user, { status } = {}) {
  const filter = {};
  if (user.role === ROLES.BUYER) filter.buyer = user.id; // object-level authorization
  if (status) filter.status = status;

  return Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('product', PRODUCT_FIELDS)
    .populate('buyer', BUYER_FIELDS)
    .lean();
}

async function getOrderById(user, orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  // Ownership check BEFORE populate (buyer is still a raw ObjectId here).
  if (user.role !== ROLES.ADMIN && !order.buyer.equals(user.id)) {
    throw new AppError(403, 'You are not allowed to access this order');
  }

  await order.populate([
    { path: 'product', select: PRODUCT_FIELDS },
    { path: 'buyer', select: BUYER_FIELDS },
  ]);
  return order;
}

async function updateOrderStatus(orderId, nextStatus) {
  const current = await Order.findById(orderId);
  if (!current) throw new AppError(404, 'Order not found');

  const allowed = ORDER_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(409, `Cannot change order status from ${current.status} to ${nextStatus}`);
  }

  // Conditional update: only succeeds if nobody changed the status in between.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status },
    { $set: { status: nextStatus } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!updated) {
    throw new AppError(409, 'Order was modified by another request, please reload and retry');
  }

  // D3: cancelling releases the single stock back to the storefront.
  if (nextStatus === ORDER_STATUS.CANCELLED) {
    await Product.updateOne(
      { _id: updated.product, status: PRODUCT_STATUS.SOLD },
      { $set: { status: PRODUCT_STATUS.AVAILABLE } }
    );
  }

  return updated;
}

// Review module: eligibility (PRD §19). Only COMPLETED orders count.
async function hasCompletedPurchase(buyerId, productId) {
  return Boolean(await Order.exists({ buyer: buyerId, product: productId, status: ORDER_STATUS.COMPLETED }));
}

// Product module: block deletion of products that have order history (PRD §24).
async function productHasOrders(productId) {
  return Boolean(await Order.exists({ product: productId }));
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  hasCompletedPurchase,
  productHasOrders,
};
