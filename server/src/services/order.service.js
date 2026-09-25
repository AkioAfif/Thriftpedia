const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS } = require('../constants/order');

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

module.exports = { createOrder };
