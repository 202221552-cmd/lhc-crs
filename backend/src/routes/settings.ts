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
    const settings = await prisma.systemSetting.findMany();
    const result: Record<string, string | null> = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch { res.status(400).json({ error: 'فشل تحميل الإعدادات' }); }
});

router.put('/', authMiddleware, requirePermission('admin.settings'), async (req, res) => {
  try {
    const entries = req.body;

    // Handle base64 logo — save to disk
    if (entries.centerLogo && typeof entries.centerLogo === 'string' && entries.centerLogo.startsWith('data:image')) {
      // Delete old logo file if exists
      const oldValue = await prisma.systemSetting.findUnique({ where: { key: 'centerLogo' } });
      if (oldValue?.value && oldValue.value.startsWith('/uploads/')) {
        const relativePath = oldValue.value.replace('/uploads/', '');
        deleteFile(relativePath);
      }

      const matches = entries.centerLogo.match(/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1];
        const data = Buffer.from(matches[2], 'base64');
        const filename = `logo-${uuidv4()}.${ext}`;
        fs.writeFileSync(path.join(STORAGE_DIRS.LOGOS, filename), data);
        entries.centerLogo = `/uploads/logos/${filename}`;
      }
    }

    for (const [key, value] of Object.entries(entries)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      });
    }
    const settings = await prisma.systemSetting.findMany();
    const result: Record<string, string | null> = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch { res.status(400).json({ error: 'فشل حفظ الإعدادات' }); }
});

export default router;
