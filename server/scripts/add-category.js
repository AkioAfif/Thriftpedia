// Adds (or renames) one category without running the full seed. Upsert by slug, so it is
// idempotent: running it again with the same values changes nothing.
//
//   node scripts/add-category.js --name Tops --slug tops              DRY RUN (default): report only
//   node scripts/add-category.js --name Tops --slug tops --apply      write to the database
//   --allow-remote                                                    required for any non-local MongoDB (e.g. Atlas)
// Uses MONGO_URI from server/.env (override with: MONGO_URI=... node scripts/...).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function isLocalUri(uri) {
  if (!/^mongodb:\/\//.test(uri)) return false; // mongodb+srv:// is always a remote cluster
  const hosts = uri.replace(/^mongodb:\/\//, '').split('/')[0].split('@').pop().split(',');
  return hosts.every((host) => LOCAL_HOSTS.has(host.replace(/:\d+$/, '')));
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @returns {Promise<{ action: 'create'|'rename'|'unchanged'|'conflict', applied: boolean, name: string, slug: string, detail?: string }>}
 */
async function addCategory({ name, slug, apply = false }) {
  const cleanName = String(name ?? '').trim();
  const cleanSlug = String(slug ?? '').trim().toLowerCase();
  if (!cleanName) throw new Error('--name is required');
  if (!SLUG_RE.test(cleanSlug)) throw new Error('--slug must be lowercase letters/digits separated by single dashes, e.g. "tops"');

  const result = { name: cleanName, slug: cleanSlug, applied: false };
  const existing = await Category.findOne({ slug: cleanSlug }).lean();

  // `name` is unique too: another category may already use it under a different slug.
  const nameOwner = await Category.findOne({
    name: { $regex: `^${escapeRegex(cleanName)}$`, $options: 'i' },
    slug: { $ne: cleanSlug },
  }).lean();
  if (nameOwner) {
    return { ...result, action: 'conflict', detail: `name "${nameOwner.name}" is already used by slug "${nameOwner.slug}"` };
  }

  if (existing && existing.name === cleanName) return { ...result, action: 'unchanged' };
  const action = existing ? 'rename' : 'create';
  if (existing) result.detail = `name "${existing.name}" -> "${cleanName}"`;
  if (!apply) return { ...result, action };

  try {
    await Category.updateOne(
      { slug: cleanSlug },
      { $set: { name: cleanName }, $setOnInsert: { slug: cleanSlug } },
      { upsert: true, runValidators: true }
    );
  } catch (err) {
    if (err?.code === 11000) {
      return { ...result, action: 'conflict', detail: 'another category with this name or slug was created meanwhile' };
    }
    throw err;
  }
  return { ...result, action, applied: true };
}

function readArg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  if (!isLocalUri(uri) && !process.argv.includes('--allow-remote')) {
    throw new Error('Refusing to run against a non-local MongoDB. Pass --allow-remote only if you mean it.');
  }
  const apply = process.argv.includes('--apply');

  await mongoose.connect(uri, { autoIndex: false });
  const r = await addCategory({ name: readArg('--name'), slug: readArg('--slug'), apply });

  const prefix = apply ? 'APPLY' : 'DRY RUN';
  const messages = {
    create: `${r.applied ? 'created' : 'would create'} category "${r.name}" (slug "${r.slug}")`,
    rename: `${r.applied ? 'renamed' : 'would rename'} category "${r.slug}": ${r.detail}`,
    unchanged: `category "${r.name}" (slug "${r.slug}") already exists, nothing to do`,
    conflict: `cannot add "${r.name}" (slug "${r.slug}"): ${r.detail}`,
  };
  console.log(`${prefix}: ${messages[r.action]}`);
  if (r.action === 'conflict') process.exitCode = 1;
  else if (!apply && r.action !== 'unchanged') console.log('Re-run with --apply to write it.');
}

if (require.main === module) {
  main()
    .catch((err) => { console.error(err.message ?? err); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}

module.exports = { addCategory, isLocalUri };
