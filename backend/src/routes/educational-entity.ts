import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const entities = await prisma.educationalEntity.findMany({ include: { rooms: true }, orderBy: { createdAt: 'desc' } });
  res.json(entities);
});

router.post('/', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    const entity = await prisma.educationalEntity.create({ data: req.body });
    res.json(entity);
  } catch { res.status(400).json({ error: 'فشل إنشاء الجهة' }); }
});

router.put('/:id', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    const entity = await prisma.educationalEntity.update({ where: { id: req.params.id }, data: req.body });
    res.json(entity);
  } catch { res.status(400).json({ error: 'فشل تحديث الجهة' }); }
});

router.delete('/:id', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    await prisma.educationalEntity.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الجهة' }); }
});

export default router;
