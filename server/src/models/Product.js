const { Schema, model } = require('mongoose');
const { PRODUCT_STATUS } = require('../constants/product');

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    photos: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr.every((photo) => typeof photo === 'string' && photo.trim().length > 0),
        message: 'photos must be a non-empty array of non-empty strings',
      },
    },
    size: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.AVAILABLE,
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ status: 1 }); // browsing / availability lookups

module.exports = model('Product', productSchema);
