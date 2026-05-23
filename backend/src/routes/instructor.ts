import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const instructors = await prisma.instructor.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(instructors);
});

router.post('/', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    const instructor = await prisma.instructor.create({ data: req.body });
    res.json(instructor);
  } catch { res.status(400).json({ error: 'فشل إنشاء المدرّس' }); }
});

router.put('/:id', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    const instructor = await prisma.instructor.update({ where: { id: req.params.id }, data: req.body });
    res.json(instructor);
  } catch { res.status(400).json({ error: 'فشل تحديث المدرّس' }); }
});

router.delete('/:id', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    await prisma.instructor.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف المدرّس' }); }
});

export default router;
