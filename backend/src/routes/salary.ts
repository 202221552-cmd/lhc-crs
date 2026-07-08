import express from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET SALARIES by month/year
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    const salaries = await prisma.salary.findMany({
      where: {
        month: month ? parseInt(month as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(salaries);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// CREATE / UPSERT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data: any = { ...req.body };
    data.employeeId = parseInt(data.employeeId);
    data.baseSalary = parseFloat(data.baseSalary) || 0;
    data.bonuses = parseFloat(data.bonuses) || 0;
    data.deductions = parseFloat(data.deductions) || 0;
    data.totalSalary = data.baseSalary + data.bonuses - data.deductions;
    data.month = parseInt(data.month);
    data.year = parseInt(data.year);

    const salary = await prisma.salary.upsert({
      where: { employeeId_month_year: { employeeId: data.employeeId, month: data.month, year: data.year } },
      create: data,
      update: { bonuses: data.bonuses, deductions: data.deductions, totalSalary: data.totalSalary, status: data.status, paidDate: data.paidDate ? new Date(data.paidDate) : null },
    });
    return res.json(salary);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
