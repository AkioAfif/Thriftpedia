const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/AppError');

// Product photos live in Cloudinary; MongoDB keeps the secure_url and public_id.
const PRODUCT_PHOTO_FOLDER = 'thriftpedia/products';
const REQUIRED_ENV = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

const missingConfig = () => REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
const isConfigured = () => missingConfig().length === 0;

// Configured lazily on first use, so a missing env var never crashes server start;
// it only fails the upload with a clear message.
function getClient() {
  const missing = missingConfig();
  if (missing.length > 0) {
    console.error(`[photo-storage] Cloudinary is not configured, missing env: ${missing.join(', ')}`);
    throw new AppError(
      503,
      'Photo upload is not configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
  return cloudinary;
}

function uploadBuffer(client, buffer) {
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: PRODUCT_PHOTO_FOLDER,
        resource_type: 'image',
        allowed_formats: ALLOWED_FORMATS,
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url || !result?.public_id) return reject(new Error('Cloudinary returned no secure_url/public_id'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// Deletes Cloudinary assets. Best effort: never throws, only logs. Returns a summary for callers/tests.
async function destroyPhotos(publicIds) {
  const ids = [...new Set((publicIds ?? []).filter(Boolean))];
  if (ids.length === 0) return { deleted: [], failed: [] };
  if (!isConfigured()) {
    console.warn(`[photo-storage] skipped deleting ${ids.length} photo(s): Cloudinary is not configured`);
    return { deleted: [], failed: ids };
  }

  const client = getClient();
  const results = await Promise.allSettled(
    ids.map((id) => client.uploader.destroy(id, { resource_type: 'image', invalidate: true }))
  );
  const deleted = [];
  const failed = [];
  results.forEach((r, i) => {
    // "not found" means it is already gone, which is the goal.
    if (r.status === 'fulfilled' && ['ok', 'not found'].includes(r.value?.result)) deleted.push(ids[i]);
    else failed.push(ids[i]);
  });
  if (failed.length > 0) {
    const reason = results.find((r) => r.status === 'rejected')?.reason?.message ?? 'unexpected response';
    console.warn(`[photo-storage] could not delete ${failed.length} photo(s) from Cloudinary: ${reason}`);
  }
  return { deleted, failed };
}

// Uploads all buffers or none: if any upload fails, the ones that succeeded are removed again.
async function uploadProductPhotos(buffers) {
  const client = getClient();
  const results = await Promise.allSettled(buffers.map((buffer) => uploadBuffer(client, buffer)));
  const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failure = results.find((r) => r.status === 'rejected');

  if (failure) {
    console.error('[photo-storage] upload to Cloudinary failed:', failure.reason?.message ?? failure.reason);
    await destroyPhotos(uploaded.map((p) => p.publicId));
    throw new AppError(502, 'Uploading photos to storage failed. Please try again.');
  }
  return uploaded;
}

// public_id of a photo we own: https://res.cloudinary.com/<our cloud>/image/upload/[v123/]thriftpedia/products/<id>.<ext>
// Anything else (placeholders, legacy /uploads URLs, other clouds or folders) yields null and is never deleted.
function publicIdFromUrl(url) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName || typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
  const match = parsed.pathname.match(/^\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  if (!match || match[1] !== cloudName) return null;
  const publicId = decodeURIComponent(match[2]);
  return publicId.startsWith(`${PRODUCT_PHOTO_FOLDER}/`) && !publicId.includes('..') ? publicId : null;
}

const photoAssetsFor = (photos) =>
  (Array.isArray(photos) ? photos : []).map((url) => ({ url, publicId: publicIdFromUrl(url) }));

module.exports = {
  PRODUCT_PHOTO_FOLDER,
  REQUIRED_ENV,
  isConfigured,
  uploadProductPhotos,
  destroyPhotos,
  publicIdFromUrl,
  photoAssetsFor,
};
