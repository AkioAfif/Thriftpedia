const { Schema, model } = require('mongoose');
const { PRODUCT_STATUS } = require('../constants/product');
const { PRODUCT_CONDITION_VALUES } = require('../constants/productCondition');
const { PRODUCT_SIZE_VALUES } = require('../constants/productSize');

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
    brand: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: { type: [String], default: [] },
    size: { type: String, required: true, enum: PRODUCT_SIZE_VALUES },
    condition: { type: String, required: true, enum: PRODUCT_CONDITION_VALUES },
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

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ size: 1 });
productSchema.index({ condition: 1 });
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });

module.exports = model('Product', productSchema);