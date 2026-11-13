// Read-only pre-flight check for the partial unique index `uniq_active_order_per_product`.
// Lists products held by more than one ACTIVE order. Run it BEFORE deploying the new Order
// model: Mongoose builds the index on startup and the build fails while duplicates exist.
//
// Usage: node scripts/check-active-order-duplicates.js
//   Uses MONGO_URI from server/.env (override with: MONGO_URI=... node scripts/...)
//   Exit code 0 = safe to build the index, 1 = duplicates found, 2 = error.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { ACTIVE_ORDER_STATUSES } = require('../src/constants/order');

async function findActiveOrderDuplicates(db = mongoose.connection.db) {
  return db
    .collection('orders')
    .aggregate([
      { $match: { status: { $in: [...ACTIVE_ORDER_STATUSES] } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 },
          orders: { $push: { _id: '$_id', status: '$status', buyer: '$buyer', createdAt: '$createdAt' } },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false }); // never build indexes here
  const duplicates = await findActiveOrderDuplicates();

  if (duplicates.length === 0) {
    console.log(`OK: no product has more than one active order (${ACTIVE_ORDER_STATUSES.join(', ')}).`);
    return 0;
  }

  console.log(`FOUND ${duplicates.length} product(s) with more than one active order:`);
  for (const dup of duplicates) {
    console.log(`\nproduct ${dup._id} (${dup.count} active orders)`);
    console.table(dup.orders.map((o) => ({ order: String(o._id), status: o.status, buyer: String(o.buyer), createdAt: o.createdAt })));
  }
  console.log('\nResolve these (e.g. cancel all but the oldest) before deploying the new index.');
  return 1;
}

if (require.main === module) {
  main()
    .then((code) => { process.exitCode = code; })
    .catch((err) => { console.error(err); process.exitCode = 2; })
    .finally(() => mongoose.disconnect());
}

module.exports = { findActiveOrderDuplicates };
