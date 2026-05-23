import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { normalizeNumbers, smartFilter } from '../utils/searchEngine';

const router = express.Router();

// ==================== GET ALL / SEARCH ====================
router.get('/', authMiddleware, requirePermission('students.view'), async (req, res) => {
  try {
    const { query, status, studentType, dateFrom, dateTo, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;

    let students = await prisma.student.findMany({
      include: {
        diplomaSubscriptions: { include: { diploma: true } },
        courseSubscriptions: { include: { course: true } },
        sections: { include: { section: { include: { course: true } } } },
        installments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Smart search
    if (query && typeof query === 'string') {
      const q = normalizeNumbers(query);
      students = smartFilter(students, q, ['fullNameAr', 'fullNameEn', 'nationalId', 'passportId', 'phones', 'universityId']);
    }

    // Filters
    if (status) students = students.filter(s => s.status === status);
    if (studentType) students = students.filter(s => s.studentType === studentType);
    if (dateFrom) students = students.filter(s => new Date(s.registrationDate) >= new Date(dateFrom as string));
    if (dateTo) students = students.filter(s => new Date(s.registrationDate) <= new Date(dateTo as string));

    // Parse JSON arrays
    const parsed = students.map(s => ({
      ...s,
      phones: tryParse(s.phones, []),
      whatsappOnly: tryParse(s.whatsappOnly, [])
    }));

    return res.json({
      data: parsed.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      total: parsed.length,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطأ في جلب الطلاب' });
  }
});

// ==================== GET ONE ====================
router.get('/:id', authMiddleware, requirePermission('students.view'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        diplomaSubscriptions: { include: { diploma: true, entity: true } },
        courseSubscriptions: { include: { course: true, entity: true } },
        sections: { include: { section: { include: { course: true, room: true, instructor: true } } } },
        financialTransactions: { orderBy: { createdAt: 'desc' } },
        installments: { orderBy: { dueDate: 'asc' } }
      }
    });
    if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
    return res.json({
      ...student,
      phones: tryParse(student.phones, []),
      whatsappOnly: tryParse(student.whatsappOnly, [])
    });
  } catch {
    return res.status(500).json({ error: 'خطأ في جلب الطالب' });
  }
});

// ==================== CREATE ====================
router.post('/', authMiddleware, requirePermission('students.add'), async (req, res) => {
  try {
    const data = { ...req.body };

    // Normalize Arabic numbers to English in all relevant fields
    if (data.nationalId) data.nationalId = normalizeNumbers(data.nationalId);
    if (data.passportId) data.passportId = normalizeNumbers(data.passportId);
    if (data.universityId) data.universityId = normalizeNumbers(data.universityId);
    if (Array.isArray(data.phones)) {
      data.phones = JSON.stringify(data.phones.map((p: string) => normalizeNumbers(p)));
    }
    if (Array.isArray(data.whatsappOnly)) {
      data.whatsappOnly = JSON.stringify(data.whatsappOnly);
    }

    // Validate
    if (!data.fullNameAr) return res.status(400).json({ error: 'الاسم بالعربي مطلوب' });
    if (!data.dob) return res.status(400).json({ error: 'تاريخ الميلاد مطلوب' });
    if (data.nationality === 'JO' && data.nationalId && !/^\d{10}$/.test(data.nationalId)) {
      return res.status(400).json({ error: 'الرقم الوطني للأردنيين يجب أن يكون 10 أرقام إنجليزية' });
    }

    // Convert dob to DateTime
    data.dob = new Date(data.dob);

    const student = await prisma.student.create({ data });

    // Audit
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id,
        action: 'CREATE',
        entity: 'Student',
        details: JSON.stringify({ fullNameAr: data.fullNameAr, nationalId: data.nationalId })
      }
    });

    return res.json({ ...student, phones: tryParse(student.phones, []), whatsappOnly: tryParse(student.whatsappOnly, []) });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'فشل إنشاء الطالب' });
  }
});

// ==================== UPDATE ====================
router.put('/:id', authMiddleware, requirePermission('students.edit'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    delete data.registrationDate;

    if (data.nationalId) data.nationalId = normalizeNumbers(data.nationalId);
    if (data.passportId) data.passportId = normalizeNumbers(data.passportId);
    if (data.universityId) data.universityId = normalizeNumbers(data.universityId);
    if (Array.isArray(data.phones)) data.phones = JSON.stringify(data.phones.map((p: string) => normalizeNumbers(p)));
    if (Array.isArray(data.whatsappOnly)) data.whatsappOnly = JSON.stringify(data.whatsappOnly);
    if (data.dob) data.dob = new Date(data.dob);

    const student = await prisma.student.update({ where: { id: req.params.id }, data });

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id,
        action: 'UPDATE',
        entity: 'Student',
        details: JSON.stringify({ id: req.params.id, fullNameAr: data.fullNameAr })
      }
    });

    return res.json({ ...student, phones: tryParse(student.phones, []), whatsappOnly: tryParse(student.whatsappOnly, []) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'فشل تحديث الطالب' });
  }
});

// ==================== DELETE ====================
router.delete('/:id', authMiddleware, requirePermission('students.delete'), async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: { userId: actingUser.id, action: 'DELETE', entity: 'Student', details: JSON.stringify({ id: req.params.id }) }
    });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل حذف الطالب' });
  }
});

function tryParse(str: string, fallback: any) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default router;
