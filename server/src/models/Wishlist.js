const { Schema, model } = require('mongoose');

const wishlistSchema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      immutable: true,
    },
  },
  { timestamps: true }
);

// A buyer may save a product only once. The index also protects against
// duplicate concurrent requests, not only the service-level pre-check.
wishlistSchema.index({ buyer: 1, product: 1 }, { unique: true });
wishlistSchema.index({ buyer: 1, createdAt: -1 });

module.exports = model('Wishlist', wishlistSchema);
