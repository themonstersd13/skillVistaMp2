const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const { HTTP_STATUS } = require('../config/constants');

const MIME_EXTENSION_MAP = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
};

const sanitizeSegment = (value) => {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const resolveAudioExtension = (file) => {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  return MIME_EXTENSION_MAP[file.mimetype] || '.bin';
};

const ensureDirectory = async (directoryPath) => {
  await fs.promises.mkdir(directoryPath, { recursive: true });
};

const saveInterviewAudio = async ({ file, userId }) => {
  if (!file || !file.buffer) {
    throw new ErrorResponse('Audio file is required.', HTTP_STATUS.BAD_REQUEST);
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'interviews');
  const userDirectory = path.join(uploadsRoot, sanitizeSegment(userId));
  await ensureDirectory(userDirectory);

  const extension = resolveAudioExtension(file);
  const timestamp = Date.now();
  const fileName = `${sanitizeSegment(userId)}-${timestamp}${extension}`;
  const absolutePath = path.join(userDirectory, fileName);

  await fs.promises.writeFile(absolutePath, file.buffer);

  return {
    fileName,
    absolutePath,
    relativePath: path.relative(process.cwd(), absolutePath).replace(/\\/g, '/'),
    mimeType: file.mimetype,
    size: file.size,
  };
};

module.exports = {
  saveInterviewAudio,
};
