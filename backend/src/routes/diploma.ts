import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

async function generateDiplomaCode(): Promise<string> {
  const seq = await prisma.systemSequence.upsert({
    where: { key: 'diploma_code_v2' },
    update: { current: { increment: 1 } },
    create: { key: 'diploma_code_v2', current: 1 },
  });
  return `D${String(seq.current).padStart(6, '0')}`;
}

router.get('/', authMiddleware, async (req, res) => {
  const diplomas = await prisma.diploma.findMany({
    include: {
      courses: { include: { course: true }, orderBy: { order: 'asc' } },
      entity: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(diplomas);
});

router.post('/', authMiddleware, requirePermission('diplomas.manage'), async (req, res) => {
  const { name, description, totalHours, totalPrice, minPayment, category, entityId, courseIds } = req.body;
  if (!entityId) return res.status(400).json({ error: 'الجهة التعليمية مطلوبة' });
  try {
    const id = await generateDiplomaCode();
    const diploma = await prisma.diploma.create({
      data: {
        id, name, description,
        totalHours: parseInt(totalHours) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        minPayment: parseFloat(minPayment) || 0,
        category,
        entityId: entityId ? parseInt(entityId) : null,
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
  const { name, description, totalHours, totalPrice, minPayment, category, entityId, courseIds, status } = req.body;
  try {
    const diploma = await prisma.diploma.update({
      where: { id: (req.params.id as string) },
      data: {
        name, description, status,
        totalHours: parseInt(totalHours) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        minPayment: parseFloat(minPayment) || 0,
        category,
        entityId: entityId ? parseInt(entityId) : null
      }
    });

    // Replace course links if provided
    if (courseIds && Array.isArray(courseIds)) {
      await prisma.diplomaCourse.deleteMany({ where: { diplomaId: (req.params.id as string) } });
      for (let i = 0; i < courseIds.length; i++) {
        await prisma.diplomaCourse.create({ data: { diplomaId: (req.params.id as string), courseId: courseIds[i], order: i } });
      }
    }
    res.json(diploma);
  } catch { res.status(400).json({ error: 'فشل تحديث الدبلوم' }); }
});

router.delete('/:id', authMiddleware, requirePermission('diplomas.manage'), async (req, res) => {
  try {
    await prisma.diploma.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الدبلوم' }); }
});

export default router;
