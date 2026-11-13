// Finds products whose photos still point at local storage (localhost / 127.0.0.1 hosts or
// /uploads/... paths). Those URLs break once the API is deployed.
//
// Default is a DRY RUN: it only reports. Idempotent: running it again changes nothing new.
//   node scripts/report-legacy-photos.js                 report only
//   node scripts/report-legacy-photos.js --apply         move photos whose file still exists in
//                                                        server/uploads/products to Cloudinary
//   --allow-remote                                       required for any non-local MongoDB (e.g. Atlas)
// Uses MONGO_URI (and CLOUDINARY_* for --apply) from server/.env.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const photoStorage = require('../src/services/photoStorage.service');

const DEFAULT_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function isLocalUri(uri) {
  if (!/^mongodb:\/\//.test(uri)) return false; // mongodb+srv:// is always a remote cluster
  const hosts = uri.replace(/^mongodb:\/\//, '').split('/')[0].split('@').pop().split(',');
  return hosts.every((host) => LOCAL_HOSTS.has(host.replace(/:\d+$/, '')));
}

// A photo URL that only worked against a local server.
function isLegacyPhoto(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/uploads/')) return true;
  try {
    const u = new URL(url);
    return LOCAL_HOSTS.has(u.hostname) || u.pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

// Only a plain file name inside the uploads folder is ever read (no path traversal).
function localFileFor(url, uploadsDir) {
  let pathname;
  try {
    pathname = new URL(url, 'http://local').pathname;
  } catch {
    return null;
  }
  const name = path.basename(decodeURIComponent(pathname));
  if (!/^[\w.-]+\.(jpe?g|png|webp)$/i.test(name)) return null;
  const file = path.join(uploadsDir, name);
  return fs.existsSync(file) ? file : null;
}

async function reportLegacyPhotos({ apply = false, uploadsDir = DEFAULT_UPLOADS_DIR } = {}) {
  const products = await Product.find({}, { name: 1, status: 1, photos: 1 }).lean();
  const report = [];

  for (const product of products) {
    const legacy = product.photos.map((url, index) => ({ url, index })).filter((p) => isLegacyPhoto(p.url));
    if (legacy.length === 0) continue;

    const entry = {
      id: String(product._id),
      name: product.name,
      status: product.status,
      legacyPhotos: legacy.length,
      movable: 0,
      missing: 0,
      migrated: 0,
      needsReupload: [],
    };
    const nextPhotos = [...product.photos];

    for (const { url, index } of legacy) {
      const file = localFileFor(url, uploadsDir);
      if (!file) {
        entry.missing += 1;
        entry.needsReupload.push(url);
        continue;
      }
      entry.movable += 1;
      if (apply) {
        const [uploaded] = await photoStorage.uploadProductPhotos([fs.readFileSync(file)]);
        nextPhotos[index] = uploaded.url;
        entry.migrated += 1;
      }
    }

    if (apply && entry.migrated > 0) {
      // Guarded by the old list: if someone edited the photos meanwhile, nothing is overwritten.
      const result = await Product.updateOne(
        { _id: product._id, photos: product.photos },
        { $set: { photos: nextPhotos, photoAssets: photoStorage.photoAssetsFor(nextPhotos) } }
      );
      if (result.modifiedCount === 0) entry.migrated = 0;
    }
    report.push(entry);
  }
  return report;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  if (!isLocalUri(uri) && !process.argv.includes('--allow-remote')) {
    throw new Error('Refusing to run against a non-local MongoDB. Pass --allow-remote only after a backup.');
  }
  const apply = process.argv.includes('--apply');

  await mongoose.connect(uri, { autoIndex: false });
  const report = await reportLegacyPhotos({ apply });

  console.log(apply ? 'APPLY: photos with a local file were moved to Cloudinary.' : 'DRY RUN: nothing was changed.');
  if (report.length === 0) {
    console.log('No product uses local photo URLs.');
    return;
  }
  console.table(report.map(({ needsReupload, ...row }) => ({ ...row, needsReupload: needsReupload.length })));
  const reupload = report.filter((r) => r.needsReupload.length > 0);
  if (reupload.length > 0) {
    console.log('\nRe-upload these in Admin > Product Management (their local file is gone):');
    for (const r of reupload) console.log(`- ${r.name} (${r.id}): ${r.needsReupload.length} photo(s)`);
  }
}

if (require.main === module) {
  main()
    .catch((err) => { console.error(err.message ?? err); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}

module.exports = { reportLegacyPhotos, isLegacyPhoto, isLocalUri };
