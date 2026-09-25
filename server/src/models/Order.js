const { Schema, model } = require('mongoose');
const { ORDER_STATUS } = require('../constants/order');

const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 }); // buyer's order history
orderSchema.index({ product: 1 });              // review eligibility / product delete check

module.exports = model('Order', orderSchema);
