const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/transaction');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../constants/order');

// Orders created before payments existed have no paymentStatus field at all.
const UNPAID = { $in: [PAYMENT_STATUS.UNPAID, null] };
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new AppError(503, 'Payment is not configured');
  return key;
}

const snapBaseUrl = () =>
  process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';

// The Midtrans order_id is our Mongo _id: globally unique, unlike orderNumber (TP-0001 restarts
// whenever the database is reset, and Midtrans rejects a reused order_id).
async function requestSnapTransaction(order) {
  const amount = Math.round(order.total); // IDR, Midtrans wants an integer
  const { recipientName, phone, address, city, postalCode } = order.shippingAddress;
  const shipping = { first_name: recipientName, phone, address, city, postal_code: postalCode, country_code: 'IDN' };

  const res = await fetch(`${snapBaseUrl()}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString('base64')}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: String(order._id), gross_amount: amount },
      item_details: [
        {
          id: String(order.product),
          name: (order.productSnapshot?.name ?? 'Thrift item').slice(0, 50),
          price: amount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: order.buyerSnapshot?.name ?? recipientName,
        email: order.buyerSnapshot?.email ?? undefined,
        phone,
        shipping_address: shipping,
      },
      expiry: { unit: 'hours', duration: 24 },
    }),
  }).catch(() => null);

  if (!res?.ok) {
    if (res) console.error('Midtrans Snap error', res.status, await res.text().catch(() => ''));
    throw new AppError(502, 'Payment gateway error');
  }
  const { token, redirect_url: redirectUrl } = await res.json();
  if (!token) throw new AppError(502, 'Payment gateway error');
  return { token, redirectUrl: redirectUrl ?? null };
}

async function createSnapToken(buyerId, orderId) {
  serverKey(); // fail fast with 503 before touching anything

  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (String(order.buyer) !== String(buyerId)) throw new AppError(403, 'You are not allowed to pay for this order');
  if (order.status !== ORDER_STATUS.PENDING || order.paymentStatus !== PAYMENT_STATUS.UNPAID) {
    throw new AppError(409, 'Order can no longer be paid');
  }
  if (!order.shippingAddress) throw new AppError(400, 'Order has no shipping address');

  // Reuse the open Snap transaction: Midtrans accepts each order_id only once.
  if (order.paymentToken) return { token: order.paymentToken, redirectUrl: order.paymentRedirectUrl, created: false };

  const { token, redirectUrl } = await requestSnapTransaction(order);

  const saved = await Order.updateOne(
    { _id: order._id, paymentToken: null, status: ORDER_STATUS.PENDING, paymentStatus: UNPAID },
    { $set: { paymentToken: token, paymentRedirectUrl: redirectUrl } }
  );
  if (saved.modifiedCount === 1) return { token, redirectUrl, created: true };

  // A concurrent request saved its token first, or the order changed in between.
  const current = await Order.findById(order._id).lean();
  if (current?.paymentToken && current.status === ORDER_STATUS.PENDING) {
    return { token: current.paymentToken, redirectUrl: current.paymentRedirectUrl, created: false };
  }
  throw new AppError(409, 'Order can no longer be paid');
}

function isValidSignature({ order_id, status_code, gross_amount, signature_key }) {
  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey()}`)
    .digest('hex');
  const given = Buffer.from(signature_key, 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// Maps a Midtrans notification to what we do with it (null = nothing to do yet).
function outcomeOf({ transaction_status: status, fraud_status: fraud }) {
  if (status === 'settlement' || (status === 'capture' && fraud === 'accept')) return { paid: true };
  if (status === 'expire') return { paymentStatus: PAYMENT_STATUS.EXPIRED, note: 'Payment expired (Midtrans)' };
  if (['cancel', 'deny', 'failure'].includes(status)) {
    return { paymentStatus: PAYMENT_STATUS.FAILED, note: `Payment ${status} (Midtrans)` };
  }
  return null; // pending, capture+challenge, refunds, ...
}

const REQUIRED_FIELDS = ['order_id', 'status_code', 'gross_amount', 'signature_key', 'transaction_status'];

async function handleNotification(body) {
  if (typeof body !== 'object' || body === null || REQUIRED_FIELDS.some((key) => typeof body[key] !== 'string')) {
    throw new AppError(400, 'Invalid notification payload');
  }
  if (!isValidSignature(body)) throw new AppError(403, 'Invalid signature');

  if (!OBJECT_ID_RE.test(body.order_id)) throw new AppError(404, 'Order not found');
  const order = await Order.findById(body.order_id).lean();
  if (!order) throw new AppError(404, 'Order not found');
  if (Math.round(Number(body.gross_amount)) !== Math.round(order.total)) {
    throw new AppError(400, 'Amount does not match the order');
  }

  const outcome = outcomeOf(body);
  if (!outcome) return;

  // Every write is conditional on the order still being unpaid, so repeated or late
  // notifications match nothing and change nothing.
  await runInTransaction(async (session) => {
    const at = new Date();
    if (outcome.paid) {
      const paid = await Order.updateOne(
        { _id: order._id, status: ORDER_STATUS.PENDING, paymentStatus: UNPAID },
        {
          $set: { paymentStatus: PAYMENT_STATUS.PAID, status: ORDER_STATUS.PROCESSING },
          $push: { statusHistory: { status: ORDER_STATUS.PROCESSING, at, by: null, note: 'Payment received (Midtrans)' } },
        },
        { session }
      );
      if (paid.modifiedCount === 0) {
        // Admin cancelled while the buyer was paying: record the money, the product may be resold already.
        const late = await Order.updateOne(
          { _id: order._id, status: ORDER_STATUS.CANCELLED, paymentStatus: UNPAID },
          { $set: { paymentStatus: PAYMENT_STATUS.PAID } },
          { session }
        );
        if (late.modifiedCount === 1) console.warn(`Order ${order._id} was paid after cancellation: refund needed`);
      }
      return;
    }

    const cancelled = await Order.updateOne(
      { _id: order._id, status: ORDER_STATUS.PENDING, paymentStatus: UNPAID },
      {
        $set: { paymentStatus: outcome.paymentStatus, status: ORDER_STATUS.CANCELLED },
        $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, at, by: null, note: outcome.note } },
      },
      { session }
    );
    if (cancelled.modifiedCount === 1) {
      // Release the single stock, same as an admin cancel in order.service.updateOrderStatus.
      await Product.updateOne(
        { _id: order.product, status: PRODUCT_STATUS.SOLD },
        { $set: { status: PRODUCT_STATUS.AVAILABLE } },
        { session }
      );
    }
  });
}

module.exports = { createSnapToken, handleNotification };
