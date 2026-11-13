const { Schema, model } = require('mongoose');

// Named monotonically increasing sequences, e.g. { _id: 'order', seq: 1048 }.
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  { versionKey: false }
);

module.exports = model('Counter', counterSchema);
