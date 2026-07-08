import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { STORAGE_DIRS, deleteFile } from '../utils/fileStorage.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const backgrounds = await prisma.portalBackground.findMany();
    res.json(backgrounds);
  } catch { res.status(400).json({ error: 'فشل تحميل الخلفيات' }); }
});

router.put('/:portal', authMiddleware, requirePermission('admin.settings'), async (req, res) => {
  try {
    const { type, content } = req.body;
    let savedContent = content;

    // Handle base64 image — save to disk
    if (type === 'IMAGE' && content && typeof content === 'string' && content.startsWith('data:image')) {
      // Delete old background file if exists
      const oldBg = await prisma.portalBackground.findUnique({ where: { portal: (req.params.portal as string) } });
      if (oldBg?.content && oldBg.content.startsWith('/uploads/')) {
        const relativePath = oldBg.content.replace('/uploads/', '');
        deleteFile(relativePath);
      }

      const matches = content.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
      if (matches) {
        const data = Buffer.from(matches[2], 'base64');
        const filename = `bg-${(req.params.portal as string).toLowerCase()}-${uuidv4()}.${matches[1]}`;
        fs.writeFileSync(path.join(STORAGE_DIRS.BACKGROUNDS, filename), data);
        savedContent = `/uploads/backgrounds/${filename}`;
      }
    }

    const bg = await prisma.portalBackground.upsert({
      where: { portal: (req.params.portal as string) },
      update: { type, content: savedContent },
      create: { portal: (req.params.portal as string), type, content: savedContent },
    });
    res.json(bg);
  } catch { res.status(400).json({ error: 'فشل تحديث الخلفية' }); }
});

export default router;
