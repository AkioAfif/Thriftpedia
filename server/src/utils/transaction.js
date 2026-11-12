const mongoose = require('mongoose');

// Runs fn(session) inside a multi-document transaction (needs a replica set, e.g. Atlas).
// withTransaction retries fn on transient errors such as write conflicts between
// concurrent checkouts; any other error aborts the transaction and is rethrown.
async function runInTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { runInTransaction };
