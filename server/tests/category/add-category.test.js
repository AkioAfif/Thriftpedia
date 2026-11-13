require('../helpers/tokens');

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const Category = require('../../src/models/Category');
const { addCategory, isLocalUri } = require('../../scripts/add-category');

test.before(async () => {
  await db.connect();
  await Category.init(); // unique indexes on name and slug
});
test.after(() => db.disconnect());
test.afterEach(() => db.clear());

const tops = { name: 'Tops', slug: 'tops' };

test('AC1: dry run reports "create" and writes nothing', async () => {
  const r = await addCategory(tops);
  assert.equal(r.action, 'create');
  assert.equal(r.applied, false);
  assert.equal(await Category.countDocuments(), 0);
});

test('AC2: --apply creates it, a second run is unchanged (idempotent)', async () => {
  const first = await addCategory({ ...tops, apply: true });
  const second = await addCategory({ ...tops, apply: true });

  assert.deepEqual([first.action, first.applied], ['create', true]);
  assert.equal(second.action, 'unchanged');
  assert.equal(await Category.countDocuments({ slug: 'tops' }), 1);
});

test('AC3: the new category is served by GET /api/categories and filters the catalog', async () => {
  await Category.create({ name: 'Jackets', slug: 'jackets' });
  await addCategory({ ...tops, apply: true });

  const list = await request(app).get('/api/categories');
  const filtered = await request(app).get('/api/products?category=tops');

  assert.equal(list.status, 200);
  assert.ok(list.body.data.some((c) => c.slug === 'tops' && c.name === 'Tops'), JSON.stringify(list.body));
  assert.equal(filtered.status, 200);
});

test('AC4: existing slug with another name is a rename (dry run first)', async () => {
  await Category.create({ name: 'Top', slug: 'tops' });

  const dry = await addCategory(tops);
  assert.equal(dry.action, 'rename');
  assert.equal((await Category.findOne({ slug: 'tops' })).name, 'Top');

  const applied = await addCategory({ ...tops, apply: true });
  assert.deepEqual([applied.action, applied.applied], ['rename', true]);
  assert.equal((await Category.findOne({ slug: 'tops' })).name, 'Tops');
});

test('AC5: name already used by another slug is a conflict and writes nothing', async () => {
  await Category.create({ name: 'Tops', slug: 'shirts' });

  const r = await addCategory({ ...tops, apply: true });

  assert.equal(r.action, 'conflict');
  assert.match(r.detail, /slug "shirts"/);
  assert.equal(await Category.countDocuments(), 1);
});

test('AC6: input is normalised and validated', async () => {
  const r = await addCategory({ name: '  Tops ', slug: ' TOPS ', apply: true });
  assert.deepEqual([r.name, r.slug], ['Tops', 'tops']);
  for (const slug of ['', 'to ps', 'tops!', '-tops', 'to--ps']) {
    await assert.rejects(addCategory({ name: 'Tops', slug }), /--slug/, JSON.stringify(slug));
  }
  await assert.rejects(addCategory({ name: '  ', slug: 'tops' }), /--name/);
});

test('AC7: remote guard', () => {
  assert.equal(isLocalUri('mongodb://localhost:27017/thriftpedia'), true);
  assert.equal(isLocalUri('mongodb+srv://u:p@cluster0.example.mongodb.net/thriftpedia'), false);
});
