import express from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

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

// POST create category
router.post('/categories', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  const { name, nameAr, parentId, order } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم التصنيف مطلوب' });
  try {
    const category = await prisma.courseCategory.create({
      data: {
        name,
        nameAr: nameAr || null,
        parentId: parentId ? parseInt(parentId) : null,
        order: order ? parseInt(order) : 0,
      }
    });
    res.json(category);
  } catch { res.status(400).json({ error: 'فشل إنشاء التصنيف' }); }
});

// PUT update category
router.put('/categories/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  const { name, nameAr, parentId, order, status } = req.body;
  try {
    const category = await prisma.courseCategory.update({
      where: { id: parseInt(req.params.id as string) },
      data: { name, nameAr, parentId: parentId ? parseInt(parentId) : null, order: order ? parseInt(order) : 0, status }
    });
    res.json(category);
  } catch { res.status(400).json({ error: 'فشل تحديث التصنيف' }); }
});

// DELETE delete category
router.delete('/categories/:id', authMiddleware, requirePermission('courses.manage'), async (req, res) => {
  try {
    await prisma.courseCategory.delete({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف التصنيف - قد يكون مرتبط بدورات' }); }
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
