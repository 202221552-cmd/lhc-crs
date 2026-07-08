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

    // Handle base64 logo — store in DB (avoids file loss on Render restarts)
    if (entries.centerLogo && typeof entries.centerLogo === 'string' && entries.centerLogo.startsWith('data:image')) {
      // Delete old file on disk if exists
      const oldValue = await prisma.systemSetting.findUnique({ where: { key: 'centerLogo' } });
      if (oldValue?.value && oldValue.value.startsWith('/uploads/')) {
        const relativePath = oldValue.value.replace('/uploads/', '');
        deleteFile(relativePath);
      }
      // Store base64 directly in DB
      entries.centerLogo = entries.centerLogo;
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
