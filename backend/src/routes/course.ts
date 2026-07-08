import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

async function generateCourseCode(): Promise<string> {
  const seq = await prisma.systemSequence.upsert({
    where: { key: 'course_code_v2' },
    update: { current: { increment: 1 } },
    create: { key: 'course_code_v2', current: 1 },
  });
  return `C${String(seq.current).padStart(6, '0')}`;
}

// GET all categories
router.get('/categories', authMiddleware, async (req, res) => {
  const categories = await prisma.courseCategory.findMany({
    orderBy: { order: 'asc' },
    include: { children: true }
  });
  res.json(categories);
});

// GET all courses with category
router.get('/', authMiddleware, async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { category: true, entity: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(courses);
});

router.post('/', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  if (!req.body.entityId) return res.status(400).json({ error: 'الجهة التعليمية مطلوبة' });
  try {
    const id = await generateCourseCode();
    const data: any = { id, ...req.body };
    delete data.id; // use generated id
    data.id = id;
    if (data.hours) data.hours = parseInt(data.hours);
    if (data.price) data.price = parseFloat(data.price);
    if (data.minPayment !== undefined) data.minPayment = parseFloat(data.minPayment) || 0;
    if (data.categoryId) data.categoryId = parseInt(data.categoryId);
    if (data.entityId) data.entityId = parseInt(data.entityId); else data.entityId = null;
    const course = await prisma.course.create({
      data,
      include: { category: true }
    });
    res.json(course);
  } catch { res.status(400).json({ error: 'فشل إنشاء الدورة' }); }
});

router.put('/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    const data: any = { ...req.body };
    delete data.id; // id is immutable
    if (data.hours) data.hours = parseInt(data.hours);
    if (data.price) data.price = parseFloat(data.price);
    if (data.minPayment !== undefined) data.minPayment = parseFloat(data.minPayment) || 0;
    if (data.categoryId) data.categoryId = parseInt(data.categoryId);
    if (data.entityId) data.entityId = parseInt(data.entityId); else data.entityId = null;
    const course = await prisma.course.update({
      where: { id: (req.params.id as string) },
      data,
      include: { category: true }
    });
    res.json(course);
  } catch { res.status(400).json({ error: 'فشل تحديث الدورة' }); }
});

router.delete('/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الدورة - قد تكون مرتبطة باشتراكات' }); }
});

export default router;
