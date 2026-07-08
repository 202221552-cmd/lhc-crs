import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, requirePermission('reports.academic'), async (req, res) => {
  const requests = await prisma.requestedCourse.findMany({
    include: { student: true, course: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(requests);
});

router.post('/', authMiddleware, requirePermission('students.add'), async (req, res) => {
  const { studentId, courseId } = req.body;
  try {
    const rc = await prisma.requestedCourse.create({
      data: { studentId, courseId },
      include: { student: true, course: true }
    });
    res.json(rc);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'تم طلب هذه الدورة مسبقاً' });
    res.status(400).json({ error: 'فشل طلب الدورة' });
  }
});

router.put('/:id', authMiddleware, requirePermission('sections.assign'), async (req, res) => {
  try {
    const rc = await prisma.requestedCourse.update({ where: { id: parseInt(req.params.id as string) }, data: { status: req.body.status } });
    res.json(rc);
  } catch { res.status(400).json({ error: 'فشل تحديث الطلب' }); }
});

router.delete('/:id', authMiddleware, requirePermission('students.edit'), async (req, res) => {
  try {
    await prisma.requestedCourse.delete({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الطلب' }); }
});

export default router;
