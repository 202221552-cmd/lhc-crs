import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, requirePermission('sections.manage'), async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        course: true, room: true, instructor: true,
        students: { include: { student: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sections);
  } catch { res.status(500).json({ error: 'خطأ في جلب الشعب' }); }
});

router.get('/:id', authMiddleware, requirePermission('sections.manage'), async (req, res) => {
  try {
    const section = await prisma.section.findUnique({
      where: { id: req.params.id },
      include: {
        course: true, room: true, instructor: true,
        students: { include: { student: true } },
        attendances: { orderBy: { date: 'desc' }, take: 100 }
      }
    });
    if (!section) return res.status(404).json({ error: 'الشعبة غير موجودة' });
    res.json(section);
  } catch { res.status(500).json({ error: 'خطأ في جلب الشعبة' }); }
});

// Helper overlap checks
const checkOverlap = (s1: string, e1: string, s2: string, e2: string) => s1 < e2 && e1 > s2;
const daysOverlap = (d1str: string, d2str: string) => {
  try {
    const d1: string[] = JSON.parse(d1str), d2: string[] = JSON.parse(d2str);
    return d1.some(d => d2.includes(d));
  } catch { return false; }
};

router.post('/', authMiddleware, requirePermission('sections.manage'), async (req, res) => {
  const { courseId, roomId, instructorId, days, startTime, endTime, startDate, endDate, capacity, name } = req.body;
  if (!courseId || !roomId || !instructorId || !days || !startTime || !endTime) {
    return res.status(400).json({ error: 'جميع الحقول الإجبارية مطلوبة' });
  }
  try {
    // Room conflict check
    const roomSections = await prisma.section.findMany({ where: { roomId, status: 'OPEN' } });
    for (const rs of roomSections) {
      if (daysOverlap(days, rs.days) && checkOverlap(startTime, endTime, rs.startTime, rs.endTime)) {
        return res.status(409).json({ error: `تعارض في القاعة مع الشعبة: ${rs.name || rs.id}` });
      }
    }
    // Instructor conflict check
    const instSections = await prisma.section.findMany({ where: { instructorId, status: 'OPEN' } });
    for (const is of instSections) {
      if (daysOverlap(days, is.days) && checkOverlap(startTime, endTime, is.startTime, is.endTime)) {
        return res.status(409).json({ error: `تعارض في جدول المدرّس مع الشعبة: ${is.name || is.id}` });
      }
    }
    const section = await prisma.section.create({
      data: {
        name: name || null, courseId, roomId, instructorId,
        days, startTime, endTime,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        capacity: parseInt(capacity) || 30
      },
      include: { course: true, room: true, instructor: true }
    });

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: { userId: actingUser.id, action: 'CREATE', entity: 'Section', details: JSON.stringify({ courseId, name }) }
    });
    res.json(section);
  } catch (err: any) { res.status(400).json({ error: err.message || 'فشل إنشاء الشعبة' }); }
});

router.put('/:id', authMiddleware, requirePermission('sections.manage'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.capacity) data.capacity = parseInt(data.capacity);
    const section = await prisma.section.update({ where: { id: req.params.id }, data });
    res.json(section);
  } catch { res.status(400).json({ error: 'فشل تحديث الشعبة' }); }
});

router.delete('/:id', authMiddleware, requirePermission('sections.manage'), async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الشعبة' }); }
});

// Add student to section
router.post('/:id/students', authMiddleware, requirePermission('sections.assign'), async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'الطالب مطلوب' });
  try {
    // Check capacity
    const section = await prisma.section.findUnique({
      where: { id: req.params.id },
      include: { students: true }
    });
    if (!section) return res.status(404).json({ error: 'الشعبة غير موجودة' });
    if (section.students.length >= section.capacity) {
      return res.status(400).json({ error: 'الشعبة ممتلئة' });
    }
    const ss = await prisma.studentSection.create({
      data: { studentId, sectionId: req.params.id },
      include: { student: true, section: { include: { course: true } } }
    });
    res.json(ss);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'الطالب مسجّل في هذه الشعبة مسبقاً' });
    res.status(400).json({ error: 'فشل إضافة الطالب للشعبة' });
  }
});

// Remove student from section
router.delete('/:id/students/:studentId', authMiddleware, requirePermission('sections.assign'), async (req, res) => {
  try {
    await prisma.studentSection.deleteMany({
      where: { sectionId: req.params.id, studentId: req.params.studentId }
    });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل إزالة الطالب' }); }
});

export default router;
