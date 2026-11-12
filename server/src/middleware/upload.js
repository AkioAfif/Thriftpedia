const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Files stay in memory and go straight to Cloudinary; nothing is written to local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new AppError(400, 'Only JPG, PNG, or WEBP images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
}).array('photos', MAX_FILES);

// The mimetype is only what the client claims; check the file's real signature too.
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// Wrapped so multer errors become 400 AppErrors instead of 500s.
function uploadProductPhotos(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `Maximum ${MAX_FILES} photos`
        : err.message;
      return next(new AppError(400, message));
    }
    if (err) return next(err);

    const fake = (req.files ?? []).find((file) => detectImageType(file.buffer) === null);
    if (fake) {
      return next(new AppError(400, `"${fake.originalname}" is not a valid JPG, PNG, or WEBP image`));
    }
    next();
  });
}

module.exports = { uploadProductPhotos, detectImageType, MAX_FILE_SIZE, MAX_FILES };
