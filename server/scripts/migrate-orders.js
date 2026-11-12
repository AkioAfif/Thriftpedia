// Idempotent backfill for orders created before orderNumber/snapshots/statusHistory existed.
// Only fields that are MISSING are written, so running it again changes nothing.
//
// Usage:
//   node scripts/migrate-orders.js --dry-run     report what would change, write nothing
//   node scripts/migrate-orders.js               apply (local MongoDB only)
//   node scripts/migrate-orders.js --allow-remote   required for any non-local host (e.g. Atlas)
// Uses MONGO_URI from server/.env (override with: MONGO_URI=... node scripts/...).
//
// Before deploying to a shared DB: back it up, run check-active-order-duplicates.js,
// then run this with --dry-run first.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { ensureCounter, nextOrderNumber } = require('../src/services/counter.service');
const { ORDER_STATUS } = require('../src/constants/order');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const MIGRATION_NOTE = 'Backfilled by migrate-orders';

const NEEDS_MIGRATION = {
  $or: [
    { orderNumber: { $exists: false } },
    { buyerSnapshot: { $exists: false } },
    { productSnapshot: { $exists: false } },
    { total: { $exists: false } },
    { trackingNumber: { $exists: false } },
    { courier: { $exists: false } },
    { statusHistory: { $exists: false } },
    { statusHistory: { $size: 0 } },
  ],
};

function isLocalUri(uri) {
  if (!/^mongodb:\/\//.test(uri)) return false; // mongodb+srv:// is always a remote cluster
  const hosts = uri.replace(/^mongodb:\/\//, '').split('/')[0].split('@').pop().split(',');
  return hosts.every((host) => LOCAL_HOSTS.has(host.replace(/:\d+$/, '')));
}

function buildHistory(order) {
  const history = [{ status: ORDER_STATUS.PENDING, at: order.createdAt ?? new Date(), by: order.buyer ?? null, note: null }];
  if (order.status && order.status !== ORDER_STATUS.PENDING) {
    history.push({ status: order.status, at: order.updatedAt ?? order.createdAt ?? new Date(), by: null, note: MIGRATION_NOTE });
  }
  return history;
}

async function migrateOrders({ dryRun = false, db = mongoose.connection.db } = {}) {
  const orders = db.collection('orders');
  const users = db.collection('users');
  const products = db.collection('products');
  const stats = { scanned: 0, updated: 0, orderNumbers: 0, missingBuyer: 0, missingProduct: 0 };
  const userCache = new Map();
  const productCache = new Map();

  const load = async (cache, collection, id, projection) => {
    const key = String(id);
    if (!cache.has(key)) cache.set(key, await collection.findOne({ _id: id }, { projection }));
    return cache.get(key);
  };

  if (!dryRun) await ensureCounter();

  // Oldest first, so backfilled numbers follow the original order of purchase.
  const cursor = orders.find(NEEDS_MIGRATION).sort({ createdAt: 1, _id: 1 });
  for await (const order of cursor) {
    stats.scanned += 1;
    const $set = {};

    if (!order.buyerSnapshot) {
      const user = order.buyer ? await load(userCache, users, order.buyer, { name: 1, email: 1 }) : null;
      if (!user) stats.missingBuyer += 1;
      $set.buyerSnapshot = { name: user?.name ?? null, email: user?.email ?? null };
    }

    if (!order.productSnapshot || order.total === undefined) {
      const product = order.product
        ? await load(productCache, products, order.product, { name: 1, brand: 1, photos: 1, size: 1, condition: 1, price: 1 })
        : null;
      if (!product) stats.missingProduct += 1;
      // Best effort: legacy orders never stored the price paid, so the product's current data is used.
      if (!order.productSnapshot) {
        $set.productSnapshot = {
          name: product?.name ?? null,
          brand: product?.brand ?? '',
          photo: product?.photos?.[0] ?? null,
          size: product?.size ?? null,
          condition: product?.condition ?? null,
          price: product?.price ?? null,
        };
      }
      if (order.total === undefined) $set.total = order.productSnapshot?.price ?? product?.price ?? null;
    }

    if (order.trackingNumber === undefined) $set.trackingNumber = null;
    if (order.courier === undefined) $set.courier = null;
    if (!Array.isArray(order.statusHistory) || order.statusHistory.length === 0) {
      $set.statusHistory = buildHistory(order);
    }

    const filter = { _id: order._id };
    if (!order.orderNumber) {
      stats.orderNumbers += 1;
      // Guarded by the filter: a concurrent run cannot overwrite a number set in between.
      filter.orderNumber = { $exists: false };
      $set.orderNumber = dryRun ? '(dry-run)' : await nextOrderNumber();
    }

    if (Object.keys($set).length === 0) continue;
    if (dryRun) {
      stats.updated += 1;
      continue;
    }
    const result = await orders.updateOne(filter, { $set });
    stats.updated += result.modifiedCount;
  }

  return stats;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  const dryRun = process.argv.includes('--dry-run');
  if (!isLocalUri(uri) && !process.argv.includes('--allow-remote')) {
    throw new Error('Refusing to run against a non-local MongoDB. Pass --allow-remote only after a backup and a --dry-run.');
  }

  await mongoose.connect(uri, { autoIndex: false });
  const stats = await migrateOrders({ dryRun });
  console.log(dryRun ? 'DRY RUN, nothing written:' : 'Migration finished:');
  console.table(stats);
}

if (require.main === module) {
  main()
    .catch((err) => { console.error(err.message ?? err); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}

module.exports = { migrateOrders, isLocalUri };
