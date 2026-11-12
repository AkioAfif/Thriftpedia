const { Schema, model } = require('mongoose');
const { ORDER_STATUS, ACTIVE_ORDER_STATUSES } = require('../constants/order');

// Copies taken at checkout so the order keeps its own record even if the buyer or the
// product changes (or the buyer account is deleted) later.
const buyerSnapshotSchema = new Schema(
  {
    name: { type: String, default: null },
    email: { type: String, default: null },
  },
  { _id: false }
);

const productSnapshotSchema = new Schema(
  {
    name: { type: String, default: null },
    brand: { type: String, default: '' },
    photo: { type: String, default: null },
    size: { type: String, default: null },
    condition: { type: String, default: null },
    price: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    at: { type: Date, required: true, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = system/migration
    note: { type: String, trim: true, maxlength: 500, default: null },
  },
  { _id: false }
);

// orderNumber, snapshots, total and statusHistory are always set by checkout. They are not
// `required` only so orders created before this change stay readable until
// scripts/migrate-orders.js has backfilled them.
const orderSchema = new Schema(
  {
    orderNumber: { type: String, immutable: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
    buyerSnapshot: { type: buyerSnapshotSchema, default: undefined },
    productSnapshot: { type: productSnapshotSchema, default: undefined },
    total: { type: Number, min: 0 },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      required: true,
    },
    trackingNumber: { type: String, trim: true, maxlength: 50, default: null },
    courier: { type: String, trim: true, maxlength: 50, default: null },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true }); // sparse: legacy orders lack it
orderSchema.index({ status: 1, createdAt: -1 }); // admin list filtered by status tab
orderSchema.index({ buyer: 1, createdAt: -1 });  // buyer's order history
orderSchema.index({ product: 1, status: 1 });    // review eligibility / product delete check

// DB-level single-stock guarantee: a product can be held by at most one ACTIVE order.
// Requires MongoDB >= 6.0 ($in in partialFilterExpression).
// Run scripts/check-active-order-duplicates.js before this index is built on existing data.
orderSchema.index(
  { product: 1 },
  {
    name: 'uniq_active_order_per_product',
    unique: true,
    partialFilterExpression: { status: { $in: [...ACTIVE_ORDER_STATUSES] } },
  }
);

module.exports = model('Order', orderSchema);
