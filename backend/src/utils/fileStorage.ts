import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export const STORAGE_DIRS = {
  LOGOS: path.join(UPLOADS_DIR, 'logos'),
  BACKGROUNDS: path.join(UPLOADS_DIR, 'backgrounds'),
  ANNOUNCEMENTS: path.join(UPLOADS_DIR, 'announcements'),
  PROFILES: path.join(UPLOADS_DIR, 'profiles'),
} as const;

// Ensure directories exist
for (const dir of Object.values(STORAGE_DIRS)) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = (req.params as any).subDir || 'logos';
    const target = path.join(UPLOADS_DIR, subDir);
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|pdf|doc|docx|xls|xlsx)$/i;
    if (allowed.test(path.extname(file.originalname)) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

export function deleteFile(filePath: string) {
  const fullPath = path.resolve(UPLOADS_DIR, filePath);
  if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export function getFilePath(subDir: string, filename: string) {
  return path.join(UPLOADS_DIR, subDir, filename);
}
