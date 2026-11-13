// Isolated E2E fixture: real Express routes + real MongoDB in a temporary database.
// Never import this server into the production application.
const path = require('node:path');
const { createRequire } = require('node:module');
const serverRequire = createRequire(path.resolve(__dirname, '../../../server/package.json'));
process.env.JWT_SECRET = 'thriftpedia-isolated-test-secret';
const express = serverRequire('express');
const mongoose = serverRequire('mongoose');
const { MongoMemoryServer } = serverRequire('mongodb-memory-server');
const bcrypt = serverRequire('bcrypt');
const jwt = serverRequire('jsonwebtoken');
const app = serverRequire('./src/app');
const User = serverRequire('./src/models/User');
const Product = serverRequire('./src/models/Product');
const Order = serverRequire('./src/models/Order');
const Wishlist = serverRequire('./src/models/Wishlist');
const Review = serverRequire('./src/models/Review');
const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];
const orderId = '607f1f77bcf86cd799439011';
let failure = null;
let stats = {};
let fixture;

async function reset() {
  await Promise.all([User, Product, Order, Wishlist, Review].map((model) => model.deleteMany({})));
  const buyer = await User.create({ name: 'Nayla Test', email: 'nayla@test.dev', password: await bcrypt.hash('TestPassword1!', 10), role: 'BUYER' });
  const products = await Product.create(ids.map((_id, i) => ({ _id, name: ['Denim Trucker Jacket', 'Harrington Jacket', 'Corduroy Pants'][i], brand: ['Levi’s', 'Baracuta', 'Polo'][i], price: [680000, 650000, 460000][i], photos: [`http://127.0.0.1:5000/fixtures/${['denim', 'harrington', 'corduroy'][i]}.png`], size: 'M', condition: i === 2 ? 'GOOD_VINTAGE' : 'LIKE_NEW', status: i === 1 ? 'AVAILABLE' : 'SOLD', description: 'An original one-of-one vintage piece, carefully curated.' })));
  await Order.create({ _id: orderId, buyer: buyer._id, product: ids[0], status: 'COMPLETED' });
  await Wishlist.create(ids.map((product) => ({ buyer: buyer._id, product })));
  failure = null; stats = {};
  fixture = { token: jwt.sign({ id: buyer._id, role: 'BUYER' }, process.env.JWT_SECRET, { expiresIn: '1h' }), user: { _id: String(buyer._id), name: buyer.name, email: buyer.email, role: buyer.role }, ids, products, orderId };
  return fixture;
}

async function main() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([Wishlist.init(), Review.init()]);
  await reset();
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/fixtures', express.static(path.join(__dirname, 'photos')));
  testApp.post('/__test/reset', async (_req, res) => res.json(await reset()));
  testApp.post('/__test/fail', (req, res) => { failure = req.body; res.json({ ok: true }); });
  testApp.get('/__test/stats', (_req, res) => res.json(stats));
  testApp.post('/__test/status', async (req, res) => { await Order.updateOne({ _id: orderId }, { status: req.body.status }); res.json({ ok: true }); });
  testApp.use(async (req, res, next) => {
    const key = `${req.method} ${req.path}`;
    stats[key] = (stats[key] || 0) + 1;
    if (failure && failure.method === req.method && failure.path === req.path) {
      const status = failure.status || 500; failure = null;
      return res.status(status).json({ message: 'Injected test failure' });
    }
    if (req.method === 'POST' || req.method === 'DELETE') await new Promise((resolve) => setTimeout(resolve, 250));
    next();
  });
  testApp.use(app);
  const server = testApp.listen(5000, '127.0.0.1');
  const stop = async () => { server.close(); await mongoose.disconnect(); await mongo.stop(); process.exit(0); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
main().catch((error) => { console.error(error); process.exit(1); });
