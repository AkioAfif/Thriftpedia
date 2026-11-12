const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const photo = (text) => `https://placehold.co/600x600.png?text=${encodeURIComponent(text)}`;

const CATEGORIES = [
  { name: 'Jackets', slug: 'jackets' },
  { name: 'Pants', slug: 'pants' },
  { name: 'Hats', slug: 'hats' },
  { name: 'Knitwear', slug: 'knitwear' },
];

const PRODUCTS = [
  { name: 'Denim Trucker Jacket', brand: "Levi's Authentic", cat: 'jackets', tags: ['90s-denim'], size: 'M', condition: 'LIKE_NEW', price: 680000 },
  { name: 'Sherpa Denim Jacket', brand: 'Vintage Aviation', cat: 'jackets', tags: ['90s-denim'], size: 'M', condition: 'GOOD_VINTAGE', price: 820000 },
  { name: 'Harrington Jacket', brand: 'Baracuta England', cat: 'jackets', tags: ['everyday-classic'], size: 'M', condition: 'LIKE_NEW', price: 650000 },
  { name: 'Corduroy Pants', brand: 'Polo Ralph Lauren', cat: 'pants', tags: ['workwear'], size: 'M', condition: 'GOOD_VINTAGE', price: 460000 },
  { name: 'Suede Bucket Hat', brand: 'California Archive', cat: 'hats', tags: ['everyday-classic'], size: 'M', condition: 'LIKE_NEW', price: 290000 },
  { name: 'Cable-Knit Wool Sweater', brand: 'Aran Crafts Ireland', cat: 'knitwear', tags: ['everyday-classic'], size: 'M', condition: 'GOOD_VINTAGE', price: 540000, status: 'SOLD' },
  // Data tambahan agar filter terasa berbeda
  { name: 'Leather Biker Jacket', brand: 'Schott NYC', cat: 'jackets', tags: ['leather-jacket'], size: 'L', condition: 'GOOD_VINTAGE', price: 1250000 },
  { name: 'Chore Coat', brand: 'Carhartt', cat: 'jackets', tags: ['workwear'], size: 'L', condition: 'FAIR_DISTRESSED', price: 520000 },
  { name: 'Baggy Jeans 90s', brand: 'Guess', cat: 'pants', tags: ['90s-denim'], size: 'S', condition: 'GOOD_VINTAGE', price: 380000 },
  { name: 'Wool Beanie', brand: 'Kangol', cat: 'hats', tags: ['everyday-classic'], size: 'FREE', condition: 'NEW_WITH_TAGS', price: 150000 },
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI belum diisi di server/.env');
  await mongoose.connect(process.env.MONGO_URI);

  const categoryIds = {};
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: c },
      { upsert: true, returnDocument: 'after' }
    );
    categoryIds[c.slug] = doc._id;
  }

  for (const p of [...PRODUCTS].reverse()) {
    const { cat, status, ...rest } = p;
    const set = { ...rest, category: categoryIds[cat], photos: [photo(p.name)] };
    if (status) set.status = status;

    const update = { $set: set };
    
    if (!status) update.$setOnInsert = { status: 'AVAILABLE' };

    await Product.updateOne({ name: p.name }, update, { upsert: true });
  }

  console.log(`Seed selesai: ${CATEGORIES.length} kategori, ${PRODUCTS.length} produk`);
}

seed()
  .catch((err) => {
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());