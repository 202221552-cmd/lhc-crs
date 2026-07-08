import express from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const SHARED_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'shared-files');
if (!fs.existsSync(SHARED_DIR)) fs.mkdirSync(SHARED_DIR, { recursive: true });

const fileUploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SHARED_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.bin'}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function safePath(storagePath: string): string | null {
  const fullPath = path.resolve(SHARED_DIR, storagePath);
  if (!fullPath.startsWith(SHARED_DIR) || storagePath.includes('..')) return null;
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const parentId = req.query.parentId ? Number(req.query.parentId) : null;
    const files = await prisma.sharedFile.findMany({
      where: { parentId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return res.json(files);
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب الملفات المشتركة' });
  }
});

router.post('/folder', authMiddleware, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المجلد مطلوب' });
    const folder = await prisma.sharedFile.create({
      data: { name, type: 'FOLDER', parentId: parentId || null, path: '' },
    });
    return res.json(folder);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إنشاء المجلد' });
  }
});

router.post('/upload', authMiddleware, (req, res) => {
  const parentId = req.query.parentId ? Number(req.query.parentId) : null;

  fileUploader.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الملف' });
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });

    try {
      const fileRecord = await prisma.sharedFile.create({
        data: {
          name: req.file!.originalname,
          type: 'FILE',
          mimeType: req.file!.mimetype,
          size: req.file!.size,
          parentId,
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
    const file = await prisma.sharedFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file || file.type === 'FOLDER') return res.status(404).json({ error: 'الملف غير موجود' });
    const fp = safePath(file.path);
    if (!fp) return res.status(404).json({ error: 'الملف غير موجود على الخادم' });
    res.download(fp, file.name);
  } catch (e) {
    return res.status(500).json({ error: 'فشل تحميل الملف' });
  }
});

router.put('/rename/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });
    const file = await prisma.sharedFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) return res.status(404).json({ error: 'الملف غير موجود' });
    const updated = await prisma.sharedFile.update({ where: { id: file.id }, data: { name } });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إعادة التسمية' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await prisma.sharedFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) return res.status(404).json({ error: 'الملف غير موجود' });
    if (file.type === 'FILE') {
      const fp = safePath(file.path);
      if (fp) fs.unlinkSync(fp);
    }
    await prisma.sharedFile.delete({ where: { id: file.id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'فشل الحذف' });
  }
});

export default router;
