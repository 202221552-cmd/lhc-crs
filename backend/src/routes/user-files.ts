import express from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const USER_FILES_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'user-files');
if (!fs.existsSync(USER_FILES_DIR)) fs.mkdirSync(USER_FILES_DIR, { recursive: true });

const fileUploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = String((req as any).user.id);
      const userDir = path.join(USER_FILES_DIR, userId);
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname) || '.bin'}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function userFilePath(userId: number, storagePath: string): string {
  return path.join(USER_FILES_DIR, String(userId), storagePath);
}

function safePath(userId: number, storagePath: string): string | null {
  const baseDir = path.resolve(USER_FILES_DIR, String(userId));
  if (!fs.existsSync(baseDir)) return null;
  const fullPath = path.resolve(baseDir, storagePath);
  if (!fullPath.startsWith(baseDir) || storagePath.includes('..')) return null;
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const parentId = req.query.parentId ? Number(req.query.parentId) : null;
    const files = await prisma.userFile.findMany({
      where: { userId: user.id, parentId: parentId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return res.json(files);
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب الملفات' });
  }
});

router.post('/folder', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المجلد مطلوب' });
    const folder = await prisma.userFile.create({
      data: {
        userId: user.id,
        name,
        type: 'FOLDER',
        parentId: parentId || null,
        path: '',
      },
    });
    return res.json(folder);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إنشاء المجلد' });
  }
});

router.post('/upload', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const parentId = req.query.parentId ? Number(req.query.parentId) : null;

  fileUploader.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الملف' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });

    try {
      const fileRecord = await prisma.userFile.create({
        data: {
          userId: user.id,
          name: req.file!.originalname,
          type: 'FILE',
          mimeType: req.file!.mimetype,
          size: req.file!.size,
          parentId: parentId,
          path: req.file!.filename,
        },
      });
      return res.json(fileRecord);
    } catch (e) {
      return res.status(500).json({ error: 'فشل حفظ الملف في قاعدة البيانات' });
    }
  });
});

router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const file = await prisma.userFile.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!file || file.type === 'FOLDER') return res.status(404).json({ error: 'الملف غير موجود' });
    const fp = safePath(user.id, file.path);
    if (!fp) return res.status(404).json({ error: 'الملف غير موجود على الخادم' });
    res.download(fp, file.name);
  } catch (e) {
    return res.status(500).json({ error: 'فشل تحميل الملف' });
  }
});

router.put('/rename/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });
    const file = await prisma.userFile.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!file) return res.status(404).json({ error: 'الملف غير موجود' });
    const updated = await prisma.userFile.update({
      where: { id: file.id },
      data: { name },
    });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إعادة التسمية' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const file = await prisma.userFile.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!file) return res.status(404).json({ error: 'الملف غير موجود' });
    if (file.type === 'FILE') {
      const fp = safePath(user.id, file.path);
      if (fp) fs.unlinkSync(fp);
    }
    await prisma.userFile.delete({ where: { id: file.id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'فشل الحذف' });
  }
});

export default router;
