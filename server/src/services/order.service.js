const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/transaction');
const { ensureCounter, nextOrderNumber } = require('./counter.service');
const ROLES = require('../constants/roles');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../constants/order');

const PRODUCT_FIELDS = 'name brand photos size condition price status';
const BUYER_FIELDS = 'name email'; // never expose password/passwordHash
const HISTORY_ACTOR_FIELDS = 'name role';
const DUPLICATE_KEY = 11000;

const ORDER_SORTS = Object.freeze({
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  total_desc: { total: -1, _id: -1 },
  total_asc: { total: 1, _id: 1 },
});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function createOrder({ buyerId, productId, shippingAddress }) {
  const buyer = await User.findById(buyerId).select(BUYER_FIELDS).lean();
  if (!buyer) throw new AppError(401, 'Account no longer exists');

  await ensureCounter(); // outside the transaction, see counter.service

  try {
    return await runInTransaction(async (session) => {
      // Availability check and claim in ONE conditional write. Concurrent checkouts of the
      // same product write-conflict here; the retried losers then see SOLD and get 409.
      const claimed = await Product.findOneAndUpdate(
        { _id: productId, status: PRODUCT_STATUS.AVAILABLE },
        { $set: { status: PRODUCT_STATUS.SOLD } },
        { returnDocument: 'after', runValidators: true, session }
      );

      if (!claimed) {
        const exists = await Product.exists({ _id: productId }).session(session);
        if (!exists) throw new AppError(404, 'Product not found');
        throw new AppError(409, 'Product has already been sold');
      }

      // Taken only after a successful claim, so rejected checkouts do not burn numbers.
      const orderNumber = await nextOrderNumber({ session });

      // If this fails the whole transaction aborts, so the product claim is rolled back too.
      const [order] = await Order.create(
        [
          {
            orderNumber,
            buyer: buyerId,
            product: claimed._id,
            buyerSnapshot: { name: buyer.name, email: buyer.email },
            productSnapshot: {
              name: claimed.name,
              brand: claimed.brand,
              photo: claimed.photos?.[0] ?? null,
              size: claimed.size,
              condition: claimed.condition,
              price: claimed.price,
            },
            total: claimed.price, // single item, single stock
            status: ORDER_STATUS.PENDING,
            statusHistory: [{ status: ORDER_STATUS.PENDING, by: buyerId }],
            shippingAddress,
          },
        ],
        { session }
      );
      return order;
    });
  } catch (err) {
    // Last line of defence: the partial unique index rejected a second active order.
    if (err?.code === DUPLICATE_KEY) throw new AppError(409, 'Product has already been sold');
    throw err;
  }
}

async function listOrders(user, { page = 1, limit = 10, status, q, sort = 'newest' } = {}) {
  // `base` decides what the tab counts see: ownership + search, but NOT the status filter.
  const base = {};
  if (user.role === ROLES.BUYER) base.buyer = new mongoose.Types.ObjectId(user.id); // object-level authorization
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    base.$or = [{ orderNumber: regex }, { 'buyerSnapshot.name': regex }, { 'buyerSnapshot.email': regex }];
  }
  const filter = status ? { ...base, status } : base;

  const [items, grouped] = await Promise.all([
    Order.find(filter)
      .select('-statusHistory -__v')
      .sort(ORDER_SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', PRODUCT_FIELDS)
      .populate('buyer', BUYER_FIELDS)
      .lean(),
    Order.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { ALL: 0 };
  for (const value of Object.values(ORDER_STATUS)) counts[value] = 0;
  for (const { _id, count } of grouped) {
    if (_id in counts) counts[_id] = count;
    counts.ALL += count;
  }

  const total = status ? counts[status] : counts.ALL;
  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    counts,
  };
}

async function getOrderById(user, orderId) {
  const order = await Order.findById(orderId).select('-__v').lean();
  if (!order) throw new AppError(404, 'Order not found');

  // Ownership check BEFORE populate (buyer is still a raw ObjectId here).
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isAdmin && String(order.buyer) !== String(user.id)) {
    throw new AppError(403, 'You are not allowed to access this order');
  }

  await Order.populate(order, [
    { path: 'product', select: PRODUCT_FIELDS },
    { path: 'buyer', select: BUYER_FIELDS },
    // Who changed the status is staff-internal: only admins see the actor.
    ...(isAdmin ? [{ path: 'statusHistory.by', select: HISTORY_ACTOR_FIELDS }] : []),
  ]);
  if (!isAdmin) {
    order.statusHistory = (order.statusHistory ?? []).map(({ by, ...entry }) => entry);
  }

  // Only admins can change status, so buyers always get an empty list.
  order.allowedTransitions = isAdmin ? [...(ORDER_TRANSITIONS[order.status] ?? [])] : [];
  return order;
}

async function updateOrderStatus(actor, orderId, { status: nextStatus, trackingNumber, courier, note } = {}) {
  await runInTransaction(async (session) => {
    const current = await Order.findById(orderId).session(session);
    if (!current) throw new AppError(404, 'Order not found');

    const allowed = ORDER_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(409, `Cannot change order status from ${current.status} to ${nextStatus}`);
    }

    const $set = { status: nextStatus };
    if (nextStatus === ORDER_STATUS.SHIPPED) {
      $set.trackingNumber = trackingNumber;
      $set.courier = courier ?? null;
    }
    const entry = { status: nextStatus, at: new Date(), by: actor.id, note: note ?? null };

    // Conditional update: only succeeds if nobody changed the status in between.
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: current.status },
      { $set, $push: { statusHistory: entry } },
      { returnDocument: 'after', runValidators: true, session }
    );
    if (!updated) {
      throw new AppError(409, 'Order was modified by another request, please reload and retry');
    }

    // Cancelling (from any active status) releases the single stock, in the same transaction.
    if (nextStatus === ORDER_STATUS.CANCELLED) await releaseProduct(updated.product, session);
  });

  // Same shape as GET /api/orders/:orderId, read after the commit.
  return getOrderById(actor, orderId);
}

// Puts a cancelled order's single-stock product back on sale. Call inside the cancel's transaction.
function releaseProduct(productId, session) {
  return Product.updateOne(
    { _id: productId, status: PRODUCT_STATUS.SOLD },
    { $set: { status: PRODUCT_STATUS.AVAILABLE } },
    { session }
  );
}

// Buyer cancels their own order. Only allowed while it is still PENDING (unpaid, not processed).
async function cancelOrderByBuyer(user, orderId) {
  await runInTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError(404, 'Order not found');
    if (String(order.buyer) !== String(user.id)) throw new AppError(403, 'You are not allowed to cancel this order');
    if (order.status !== ORDER_STATUS.PENDING) throw new AppError(409, 'Only PENDING orders can be cancelled');

    // Conditional: loses cleanly to a concurrent admin update or Midtrans settlement.
    // paymentStatus stays UNPAID so a late payment is still recorded by the webhook (refund case).
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, buyer: order.buyer, status: ORDER_STATUS.PENDING },
      {
        $set: { status: ORDER_STATUS.CANCELLED },
        $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, at: new Date(), by: user.id, note: 'Cancelled by buyer' } },
      },
      { returnDocument: 'after', session }
    );
    if (!updated) throw new AppError(409, 'Only PENDING orders can be cancelled');

    await releaseProduct(updated.product, session);
  });

  return getOrderById(user, orderId);
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
  ORDER_SORTS,
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrderByBuyer,
  releaseProduct,
  hasCompletedPurchase,
  productHasOrders,
};
