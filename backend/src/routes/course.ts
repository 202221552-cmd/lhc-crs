import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(courses);
});

router.post('/', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.hours) data.hours = parseInt(data.hours);
    if (data.price) data.price = parseFloat(data.price);
    const course = await prisma.course.create({ data });
    res.json(course);
  } catch { res.status(400).json({ error: 'فشل إنشاء الدورة' }); }
});

router.put('/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.hours) data.hours = parseInt(data.hours);
    if (data.price) data.price = parseFloat(data.price);
    const course = await prisma.course.update({ where: { id: req.params.id }, data });
    res.json(course);
  } catch { res.status(400).json({ error: 'فشل تحديث الدورة' }); }
});

router.delete('/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الدورة - قد تكون مرتبطة باشتراكات' }); }
});

export default router;
