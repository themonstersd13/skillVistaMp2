const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const { HTTP_STATUS } = require('../config/constants');

const readAudioMetadata = async (audioPath) => {
  const absolutePath = path.resolve(process.cwd(), audioPath);
  const stats = await fs.promises.stat(absolutePath).catch(() => null);

  if (!stats || !stats.isFile()) {
    throw new ErrorResponse('Audio file does not exist for transcription.', HTTP_STATUS.NOT_FOUND);
  }

  return {
    absolutePath,
    fileName: path.basename(absolutePath),
    fileSize: stats.size,
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
  };
};

const buildTranscriptText = ({ fileName, fileSize, mimeType }) => {
  return [
    'Transcript placeholder generated asynchronously by the audio worker.',
    `Source file ${fileName}.`,
    `Mime type ${mimeType || 'unknown'}.`,
    `Payload size ${fileSize} bytes.`,
    'Replace this service with a real speech-to-text provider in the next step.',
  ].join(' ');
};

const transcribeAudio = async ({ audioPath, mimeType }) => {
  const metadata = await readAudioMetadata(audioPath);
  const transcriptText = buildTranscriptText({
    fileName: metadata.fileName,
    fileSize: metadata.fileSize,
    mimeType,
  });

  return {
    transcriptText,
    transcriptMeta: {
      provider: 'local-placeholder',
      checksum: crypto.createHash('sha1').update(transcriptText).digest('hex'),
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: mimeType || 'unknown',
      sourcePath: audioPath,
      generatedAt: new Date().toISOString(),
    },
  };
};

module.exports = {
  transcribeAudio,
};
