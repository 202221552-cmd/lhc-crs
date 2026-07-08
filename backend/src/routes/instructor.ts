import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

// GET /api/instructors — optionally include stats
router.get('/', authMiddleware, async (req, res) => {
  const { stats, withoutAccount } = req.query;
  const instructors = await prisma.instructor.findMany({
    orderBy: { createdAt: 'desc' },
    include: (stats === 'true' ? {
      sections: { where: { status: 'OPEN' }, select: { id: true } },
      payments: { select: { amount: true, status: true } }
    } : undefined)
  });
  const users = await prisma.user.findMany({
    where: { instructorId: { not: null } },
    select: { instructorId: true }
  });
  const withAccountIds = new Set(users.map(u => u.instructorId));
  const withHasAccount = instructors.map(i => ({
    ...i,
    hasAccount: withAccountIds.has(i.id),
  }));
  const filtered = withoutAccount === 'true'
    ? withHasAccount.filter(i => !i.hasAccount)
    : withHasAccount;

  if (stats === 'true') {
    const result = filtered.map(inst => {
      const payments = inst.payments || [];
      const totalDue = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
      const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
      return {
        ...inst,
        activeSectionCount: (inst.sections as any[])?.length || 0,
        totalDue,
        totalPaid,
        totalPending: (inst.sections as any[])?.length * inst.courseRate
      };
    });
    return res.json(result);
  }

  res.json(filtered);
});

// GET /api/instructors/:id — single instructor
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: parseInt(req.params.id as string) }
    });
    if (!instructor) return res.status(404).json({ error: 'المحاضر غير موجود' });
    res.json(instructor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      specialization: req.body.specialization || null,
      phone: req.body.phone || null,
      email: req.body.email || null,
      type: req.body.type || 'INTERNAL',
      employmentType: req.body.employmentType || 'FULL_TIME',
      status: req.body.status || 'ACTIVE',
      salaryType: req.body.salaryType || 'PER_COURSE',
      fixedSalary: parseFloat(req.body.fixedSalary) || 0,
      courseRate: parseFloat(req.body.courseRate) || 0,
      hourlyRate: parseFloat(req.body.hourlyRate) || 0,
      paymentMethod: req.body.paymentMethod || 'PER_COURSE',
      iban: req.body.iban || null
    };
    const instructor = await prisma.instructor.create({ data });
    res.json(instructor);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'فشل إنشاء المدرّس' });
  }
});

router.put('/:id', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.specialization !== undefined) data.specialization = req.body.specialization || null;
    if (req.body.phone !== undefined) data.phone = req.body.phone || null;
    if (req.body.email !== undefined) data.email = req.body.email || null;
    if (req.body.type !== undefined) data.type = req.body.type;
    if (req.body.employmentType !== undefined) data.employmentType = req.body.employmentType;
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.salaryType !== undefined) data.salaryType = req.body.salaryType;
    if (req.body.fixedSalary !== undefined) data.fixedSalary = parseFloat(req.body.fixedSalary) || 0;
    if (req.body.courseRate !== undefined) data.courseRate = parseFloat(req.body.courseRate) || 0;
    if (req.body.hourlyRate !== undefined) data.hourlyRate = parseFloat(req.body.hourlyRate) || 0;
    if (req.body.paymentMethod !== undefined) data.paymentMethod = req.body.paymentMethod;
    if (req.body.iban !== undefined) data.iban = req.body.iban || null;

    const instructor = await prisma.instructor.update({ where: { id: parseInt(req.params.id as string) }, data });
    res.json(instructor);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'فشل تحديث المدرّس' });
  }
});

router.delete('/:id', authMiddleware, requirePermission('admin.instructors'), async (req, res) => {
  try {
    await prisma.instructor.delete({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف المدرّس' }); }
});

export default router;
