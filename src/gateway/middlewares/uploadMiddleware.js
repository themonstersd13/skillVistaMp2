const multer = require('multer');
const { APP_CONSTANTS, HTTP_STATUS } = require('../../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('audio/')) {
    return cb(null, true);
  }

  const error = new Error('Only audio uploads are allowed.');
  error.statusCode = HTTP_STATUS.BAD_REQUEST;
  return cb(error);
};

const upload = multer({
  storage,
  limits: {
    fileSize: APP_CONSTANTS.MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

module.exports = upload;
