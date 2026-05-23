import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const diplomas = await prisma.diploma.findMany({
    include: { courses: { include: { course: true }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(diplomas);
});

router.post('/', authMiddleware, requirePermission('diplomas.manage'), async (req, res) => {
  const { name, description, totalHours, totalPrice, category, courseIds } = req.body;
  try {
    const diploma = await prisma.diploma.create({
      data: {
        name, description,
        totalHours: parseInt(totalHours) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        category,
        courses: {
          create: (courseIds || []).map((id: string, index: number) => ({ courseId: id, order: index }))
        }
      },
      include: { courses: { include: { course: true } } }
    });
    res.json(diploma);
  } catch (err: any) { res.status(400).json({ error: err.message || 'فشل إنشاء الدبلوم' }); }
});

router.put('/:id', authMiddleware, requirePermission('diplomas.manage'), async (req, res) => {
  const { name, description, totalHours, totalPrice, category, courseIds } = req.body;
  try {
    const diploma = await prisma.diploma.update({
      where: { id: req.params.id },
      data: {
        name, description,
        totalHours: parseInt(totalHours) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        category
      }
    });

    // Replace course links if provided
    if (courseIds && Array.isArray(courseIds)) {
      await prisma.diplomaCourse.deleteMany({ where: { diplomaId: req.params.id } });
      for (let i = 0; i < courseIds.length; i++) {
        await prisma.diplomaCourse.create({ data: { diplomaId: req.params.id, courseId: courseIds[i], order: i } });
      }
    }
    res.json(diploma);
  } catch { res.status(400).json({ error: 'فشل تحديث الدبلوم' }); }
});

router.delete('/:id', authMiddleware, requirePermission('diplomas.manage'), async (req, res) => {
  try {
    await prisma.diploma.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الدبلوم' }); }
});

export default router;
