import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

// ==================== GENERATE INSTALLMENTS (helper) ====================
export async function generateInstallments(
  studentId: string,
  subscriptionId: string,
  subscriptionType: 'DIPLOMA' | 'COURSE',
  totalAmount: number,
  installmentsCount: number,
  startDate: Date = new Date()
) {
  const amountPerInstall = Math.round((totalAmount / installmentsCount) * 100) / 100;
  const installments = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    installments.push(
      await prisma.installment.create({
        data: {
          studentId,
          subscriptionId,
          subscriptionType,
          installmentNumber: i,
          totalInstallments: installmentsCount,
          dueDate,
          amount: amountPerInstall,
          remainingAmount: amountPerInstall,
          status: 'PENDING'
        }
      })
    );
  }
  return installments;
}

// ==================== GET ALL INSTALLMENTS ====================
router.get('/', authMiddleware, requirePermission('finance.installments'), async (req, res) => {
  try {
    const { status, studentId, subscriptionId, overdueOnly, upcomingDays } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (studentId) where.studentId = studentId as string;
    if (subscriptionId) where.subscriptionId = subscriptionId as string;
    if (overdueOnly === 'true') {
      where.status = 'PENDING';
      where.dueDate = { lt: new Date() };
    }
    if (upcomingDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(upcomingDays as string));
      where.dueDate = { lte: futureDate, gte: new Date() };
      where.status = 'PENDING';
    }

    const installments = await prisma.installment.findMany({
      where,
      include: { student: { select: { id: true, fullNameAr: true, fullNameEn: true, phones: true } } },
      orderBy: { dueDate: 'asc' }
    });

    // Auto-mark overdue
    const now = new Date();
    const overdueIds = installments
      .filter(i => i.status === 'PENDING' && new Date(i.dueDate) < now)
      .map(i => i.id);
    if (overdueIds.length > 0) {
      await prisma.installment.updateMany({ where: { id: { in: overdueIds } }, data: { status: 'OVERDUE' } });
    }

    return res.json(installments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطأ في جلب الأقساط' });
  }
});

// ==================== GET SUMMARY (dashboard cards) ====================
router.get('/summary', authMiddleware, requirePermission('finance.installments'), async (req, res) => {
  try {
    const now = new Date();
    const [pending, overdue, paidToday, total] = await Promise.all([
      prisma.installment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: true }),
      prisma.installment.aggregate({ where: { status: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
      prisma.installment.aggregate({ where: { status: 'PAID', paymentDate: { gte: new Date(now.toDateString()) } }, _sum: { paidAmount: true }, _count: true }),
      prisma.installment.aggregate({ _sum: { amount: true }, _count: true })
    ]);
    return res.json({ pending, overdue, paidToday, total });
  } catch {
    return res.status(500).json({ error: 'خطأ في الملخص' });
  }
});

// ==================== GET STUDENT INSTALLMENTS ====================
router.get('/student/:studentId', authMiddleware, requirePermission('finance.installments'), async (req, res) => {
  try {
    const installments = await prisma.installment.findMany({
      where: { studentId: req.params.studentId },
      orderBy: [{ subscriptionId: 'asc' }, { installmentNumber: 'asc' }]
    });
    return res.json(installments);
  } catch {
    return res.status(500).json({ error: 'خطأ في جلب أقساط الطالب' });
  }
});

// ==================== PAY INSTALLMENT ====================
router.post('/:id/pay', authMiddleware, requirePermission('finance.installments'), async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const installment = await prisma.installment.findUnique({ where: { id: req.params.id } });
    if (!installment) return res.status(404).json({ error: 'القسط غير موجود' });
    if (installment.status === 'PAID') return res.status(400).json({ error: 'هذا القسط مدفوع بالفعل' });

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) return res.status(400).json({ error: 'مبلغ غير صالح' });

    const newPaid = installment.paidAmount + payAmount;
    const remaining = Math.max(0, installment.amount - newPaid);
    const newStatus = remaining === 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : installment.status);

    const updated = await prisma.installment.update({
      where: { id: req.params.id },
      data: {
        paidAmount: newPaid,
        remainingAmount: remaining,
        status: newStatus,
        paymentDate: newStatus === 'PAID' ? new Date() : installment.paymentDate,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || installment.notes
      }
    });

    // Create financial transaction record
    const actingUser = (req as any).user;
    const lastTx = await prisma.financialTransaction.findFirst({ orderBy: { receiptNumber: 'desc' } });
    const nextReceipt = (lastTx?.receiptNumber || 0) + 1;

    await prisma.financialTransaction.create({
      data: {
        studentId: installment.studentId,
        subscriptionId: installment.subscriptionId,
        subscriptionType: installment.subscriptionType,
        installmentId: installment.id,
        type: 'RECEIPT',
        amount: payAmount,
        paymentMethod: paymentMethod || 'CASH',
        status: 'COMPLETED',
        receiptNumber: nextReceipt,
        notes: notes || `دفع قسط ${installment.installmentNumber}/${installment.totalInstallments}`
      }
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id,
        action: 'PAY',
        entity: 'Installment',
        details: JSON.stringify({ installmentId: req.params.id, amount: payAmount, paymentMethod })
      }
    });

    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'فشل دفع القسط' });
  }
});

// ==================== UPDATE INSTALLMENT (reschedule) ====================
router.put('/:id', authMiddleware, requirePermission('finance.installments'), async (req, res) => {
  try {
    const { dueDate, notes, amount } = req.body;
    const data: any = {};
    if (dueDate) data.dueDate = new Date(dueDate);
    if (notes !== undefined) data.notes = notes;
    if (amount) { data.amount = parseFloat(amount); data.remainingAmount = parseFloat(amount) - (data.paidAmount || 0); }

    const updated = await prisma.installment.update({ where: { id: req.params.id }, data });
    return res.json(updated);
  } catch {
    return res.status(400).json({ error: 'فشل تعديل القسط' });
  }
});

export default router;
