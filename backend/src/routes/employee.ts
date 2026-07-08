import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

// GET ALL
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { withoutAccount, query } = req.query;
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const users = await prisma.user.findMany({
      where: { employeeId: { not: null } },
      select: { employeeId: true }
    });
    const withAccountIds = new Set(users.map(u => u.employeeId));
    let result = employees.map(e => ({
      ...e,
      hasAccount: withAccountIds.has(e.id),
    }));
    if (withoutAccount === 'true') {
      result = result.filter(e => !e.hasAccount);
    }
    if (query) {
      const q = String(query).toLowerCase();
      result = result.filter(e => e.fullName?.toLowerCase().includes(q));
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET ONE
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { salaries: true, commissions: true, vacations: true }
    });
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });
    return res.json(employee);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    const data: any = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    data.baseSalary = parseFloat(data.baseSalary) || 0;
    data.commissionValue = parseFloat(data.commissionValue) || 0;
    if (data.confirmationDate) data.confirmationDate = new Date(data.confirmationDate);
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.hasSocialInsurance === undefined) data.hasSocialInsurance = false;
    if (!data.idImages) data.idImages = '[]';
    if (!data.contractImages) data.contractImages = '[]';
    const employee = await prisma.employee.create({ data });
    return res.json(employee);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    const data: any = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    data.baseSalary = parseFloat(data.baseSalary) || 0;
    data.commissionValue = parseFloat(data.commissionValue) || 0;
    if (data.confirmationDate) data.confirmationDate = new Date(data.confirmationDate);
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    const employee = await prisma.employee.update({ where: { id: parseInt(req.params.id as string) }, data });
    return res.json(employee);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT - update assigned entity IDs (for supervisors)
router.put('/:id/assigned-entities', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    const { assignedEntityIds } = req.body;
    const updated = await prisma.employee.update({
      where: { id: parseInt(req.params.id as string) },
      data: { assignedEntityIds: JSON.stringify(assignedEntityIds || []) }
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: parseInt(req.params.id as string) } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
