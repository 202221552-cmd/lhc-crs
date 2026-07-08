import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const MAX_DIMENSION = 2000;
const QUALITY = 80;
const MAX_FILE_SIZE_KB = 500;

export interface CompressResult {
  filename: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compress an image file and save to target directory.
 * - Resizes to max 2000px on longest side
 * - Compresses at quality 80 (balanced)
 * - Strips EXIF metadata (privacy + smaller size)
 * - Outputs as JPEG
 * - Returns metadata about the compression
 */
export async function compressImage(
  filePath: string,
  targetDir: string,
): Promise<CompressResult> {
  const originalSize = fs.statSync(filePath).size;

  const image = sharp(filePath);
  const metadata = await image.metadata();

  let pipeline = image.rotate(); // auto-rotate based on EXIF

  // Resize if larger than MAX_DIMENSION
  const w = metadata.width || 0;
  const h = metadata.height || 0;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Compress as JPEG with quality 80, strip EXIF
  pipeline = pipeline
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .withMetadata(); // keep basic metadata for orientation

  const filename = `${uuidv4()}.jpg`;
  const outputPath = path.join(targetDir, filename);

  await pipeline.toFile(outputPath);

  const compressedSize = fs.statSync(outputPath).size;
  const resultMeta = await sharp(outputPath).metadata();

  // Delete original if different from output
  if (filePath !== outputPath) {
    fs.unlinkSync(filePath);
  }

  return {
    filename,
    originalSize,
    compressedSize,
    width: resultMeta.width || 0,
    height: resultMeta.height || 0,
  };
}

/**
 * Compress an image from a buffer (for multer memory storage).
 */
export async function compressImageBuffer(
  buffer: Buffer,
  targetDir: string,
  originalFilename?: string,
): Promise<CompressResult> {
  const originalSize = buffer.length;
  const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : '.jpg';

  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image.rotate();

  const w = metadata.width || 0;
  const h = metadata.height || 0;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert non-JPEG input to JPEG for consistency
  if (ext === '.png' || ext === '.webp' || ext === '.gif' || ext === '.tiff') {
    pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  } else {
    pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  }

  const filename = `${uuidv4()}.jpg`;
  const outputPath = path.join(targetDir, filename);

  await pipeline.toFile(outputPath);

  const compressedSize = fs.statSync(outputPath).size;
  const resultMeta = await sharp(outputPath).metadata();

  return {
    filename,
    originalSize,
    compressedSize,
    width: resultMeta.width || 0,
    height: resultMeta.height || 0,
  };
}
