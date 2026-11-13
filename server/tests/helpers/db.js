const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

// Single-node replica set: multi-document transactions are not supported on a standalone mongod.
async function connect() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  // Build every schema index (incl. the partial unique one) before tests rely on it.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function clear() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

async function disconnect() {
  await mongoose.disconnect();
  await replSet?.stop();
}

module.exports = { connect, clear, disconnect };
