import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const rooms = await prisma.room.findMany({ include: { entity: true }, orderBy: { createdAt: 'desc' } });
  res.json(rooms);
});

router.post('/', authMiddleware, requirePermission('admin.rooms'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.capacity) data.capacity = parseInt(data.capacity);
    const room = await prisma.room.create({ data });
    res.json(room);
  } catch { res.status(400).json({ error: 'فشل إنشاء القاعة' }); }
});

router.put('/:id', authMiddleware, requirePermission('admin.rooms'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.capacity) data.capacity = parseInt(data.capacity);
    const room = await prisma.room.update({ where: { id: req.params.id }, data });
    res.json(room);
  } catch { res.status(400).json({ error: 'فشل تحديث القاعة' }); }
});

router.delete('/:id', authMiddleware, requirePermission('admin.rooms'), async (req, res) => {
  try {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف القاعة' }); }
});

export default router;
