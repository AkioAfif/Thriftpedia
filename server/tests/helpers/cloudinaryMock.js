// Replaces the Cloudinary SDK calls used by photoStorage.service with in-memory fakes,
// so no test ever makes a network request. Mocks are restored automatically by node:test.
const cloudinary = require('cloudinary').v2;

const FAKE_ENV = {
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_API_SECRET: 'test-secret',
};

function setCloudinaryEnv(t, values = FAKE_ENV) {
  const saved = Object.fromEntries(Object.keys(FAKE_ENV).map((k) => [k, process.env[k]]));
  for (const key of Object.keys(FAKE_ENV)) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const cloudUrl = (publicId, cloud = FAKE_ENV.CLOUDINARY_CLOUD_NAME) =>
  `https://res.cloudinary.com/${cloud}/image/upload/v1700000000/${publicId}.jpg`;

/**
 * @param t node:test context
 * @param {{ failUploadAt?: number, destroyThrows?: boolean, env?: object|null }} options
 *   env: null removes the Cloudinary env vars (simulates a server without config).
 */
function mockCloudinary(t, { failUploadAt = -1, destroyThrows = false, env = FAKE_ENV } = {}) {
  setCloudinaryEnv(t, env ?? {});
  const uploads = [];
  const destroyed = [];

  t.mock.method(cloudinary, 'config', () => ({}));
  t.mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => ({
    end(buffer) {
      const n = uploads.length;
      uploads.push({ options, size: buffer.length });
      setImmediate(() => {
        if (n === failUploadAt) return callback(new Error('simulated Cloudinary failure'));
        const publicId = `${options.folder}/photo-${n}`;
        callback(null, { secure_url: cloudUrl(publicId), public_id: publicId });
      });
    },
  }));
  t.mock.method(cloudinary.uploader, 'destroy', async (publicId) => {
    if (destroyThrows) throw new Error('simulated Cloudinary outage');
    destroyed.push(publicId);
    return { result: 'ok' };
  });
  // Anything else on the SDK would be a real network call: make it fail loudly.
  t.mock.method(cloudinary.uploader, 'upload', async () => {
    throw new Error('unexpected cloudinary.uploader.upload call in tests');
  });

  return { uploads, destroyed };
}

// Smallest buffers whose signatures pass the upload middleware.
const IMAGES = {
  png: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]),
  jpg: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]),
  webp: Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)]),
};

module.exports = { FAKE_ENV, mockCloudinary, setCloudinaryEnv, cloudUrl, IMAGES };
