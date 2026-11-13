const Counter = require('../models/Counter');

const ORDER_COUNTER = 'order';
const DUPLICATE_KEY = 11000;

const formatOrderNumber = (seq) => `TP-${String(seq).padStart(4, '0')}`;

// Creates the counter document if it is missing. Call this OUTSIDE a transaction: a
// duplicate-key error inside a transaction would abort it, so the upsert race between
// the very first concurrent checkouts is settled here instead.
async function ensureCounter(name = ORDER_COUNTER) {
  try {
    await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: 0 } }, { upsert: true });
  } catch (err) {
    if (err?.code !== DUPLICATE_KEY) throw err; // another request created it first
  }
}

// Atomic $inc. Inside a transaction the number is only consumed if the transaction commits.
async function nextSequence(name = ORDER_COUNTER, { session } = {}) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', session }
  );
  if (!counter) throw new Error(`Counter "${name}" does not exist; call ensureCounter first`);
  return counter.seq;
}

async function nextOrderNumber({ session } = {}) {
  return formatOrderNumber(await nextSequence(ORDER_COUNTER, { session }));
}

module.exports = { ORDER_COUNTER, ensureCounter, nextSequence, nextOrderNumber, formatOrderNumber };
