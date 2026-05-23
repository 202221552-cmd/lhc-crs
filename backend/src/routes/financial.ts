import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

// ==================== GET ALL TRANSACTIONS ====================
router.get('/', authMiddleware, requirePermission('finance.view'), async (req, res) => {
  try {
    const { studentId, type, status, dateFrom, dateTo } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (type) where.type = type as string;
    if (status) where.status = status as string;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: { student: { select: { id: true, fullNameAr: true, fullNameEn: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في جلب المعاملات' });
  }
});

// ==================== FINANCIAL SUMMARY ====================
router.get('/summary', authMiddleware, requirePermission('finance.view'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.toDateString());

    const [totalReceived, totalPayments, monthlyReceipts, todayReceipts, pendingInstallments, overdueInstallments] = await Promise.all([
      prisma.financialTransaction.aggregate({ where: { type: 'RECEIPT', status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.financialTransaction.aggregate({ where: { type: 'PAYMENT', status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.financialTransaction.aggregate({ where: { type: 'RECEIPT', status: 'COMPLETED', date: { gte: startOfMonth } }, _sum: { amount: true }, _count: true }),
      prisma.financialTransaction.aggregate({ where: { type: 'RECEIPT', status: 'COMPLETED', date: { gte: startOfDay } }, _sum: { amount: true }, _count: true }),
      prisma.installment.aggregate({ where: { status: 'PENDING' }, _sum: { remainingAmount: true }, _count: true }),
      prisma.installment.aggregate({ where: { status: 'OVERDUE' }, _sum: { remainingAmount: true }, _count: true })
    ]);

    return res.json({
      totalReceived: totalReceived._sum.amount || 0,
      totalPayments: totalPayments._sum.amount || 0,
      netRevenue: (totalReceived._sum.amount || 0) - (totalPayments._sum.amount || 0),
      monthlyReceipts: { amount: monthlyReceipts._sum.amount || 0, count: monthlyReceipts._count },
      todayReceipts: { amount: todayReceipts._sum.amount || 0, count: todayReceipts._count },
      pendingInstallments: { amount: pendingInstallments._sum.remainingAmount || 0, count: pendingInstallments._count },
      overdueInstallments: { amount: overdueInstallments._sum.remainingAmount || 0, count: overdueInstallments._count }
    });
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في الملخص المالي' });
  }
});

// ==================== GET STUDENT FINANCIAL PROFILE ====================
router.get('/student/:studentId', authMiddleware, requirePermission('finance.view'), async (req, res) => {
  try {
    const [transactions, installments, student] = await Promise.all([
      prisma.financialTransaction.findMany({ where: { studentId: req.params.studentId }, orderBy: { createdAt: 'desc' } }),
      prisma.installment.findMany({ where: { studentId: req.params.studentId }, orderBy: [{ subscriptionId: 'asc' }, { installmentNumber: 'asc' }] }),
      prisma.student.findUnique({ where: { id: req.params.studentId }, include: { diplomaSubscriptions: { include: { diploma: true } }, courseSubscriptions: { include: { course: true } } } })
    ]);

    const totalCost = [
      ...((student?.diplomaSubscriptions || []).map(s => s.totalCost)),
      ...((student?.courseSubscriptions || []).map(s => s.totalCost))
    ].reduce((a, b) => a + b, 0);
    const totalPaid = transactions.filter(t => t.type === 'RECEIPT' && t.status === 'COMPLETED').reduce((a, t) => a + t.amount, 0);
    const totalRemaining = installments.filter(i => i.status !== 'PAID').reduce((a, i) => a + i.remainingAmount, 0);

    return res.json({ student, transactions, installments, summary: { totalCost, totalPaid, totalRemaining } });
  } catch {
    return res.status(500).json({ error: 'خطأ في جلب الملف المالي' });
  }
});

// ==================== CREATE RECEIPT (سند قبض) ====================
router.post('/receipt', authMiddleware, requirePermission('finance.receipts'), async (req, res) => {
  try {
    const { studentId, subscriptionId, subscriptionType, amount, paymentMethod, notes, entityId } = req.body;
    if (!studentId || !amount) return res.status(400).json({ error: 'الطالب والمبلغ مطلوبان' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'مبلغ غير صالح' });

    const lastTx = await prisma.financialTransaction.findFirst({ orderBy: { receiptNumber: 'desc' } });
    const nextReceipt = (lastTx?.receiptNumber || 0) + 1;

    // Calculate revenue split if entity provided
    let universityShare = 0, centerShare = 0, commission = 0;
    if (entityId) {
      const entity = await prisma.educationalEntity.findUnique({ where: { id: entityId } });
      if (entity) {
        universityShare = (parsedAmount * entity.uniPercentage) / 100 + entity.fixedAmount;
        centerShare = parsedAmount - universityShare;
        commission = centerShare * 0.05; // 5% center commission
      }
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        studentId,
        subscriptionId: subscriptionId || null,
        subscriptionType: subscriptionType || null,
        type: 'RECEIPT',
        amount: parsedAmount,
        paymentMethod: paymentMethod || 'CASH',
        status: 'COMPLETED',
        receiptNumber: nextReceipt,
        universityShare,
        centerShare,
        commission,
        notes: notes || null
      },
      include: { student: { select: { id: true, fullNameAr: true } } }
    });

    // Audit
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'Receipt',
        details: JSON.stringify({ receiptNumber: nextReceipt, studentId, amount: parsedAmount })
      }
    });

    return res.json(transaction);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'فشل إنشاء سند القبض' });
  }
});

// ==================== CREATE PAYMENT (سند صرف) ====================
router.post('/payment', authMiddleware, requirePermission('finance.payments'), async (req, res) => {
  try {
    const { studentId, amount, paymentMethod, notes, beneficiary } = req.body;
    if (!amount) return res.status(400).json({ error: 'المبلغ مطلوب' });

    const parsedAmount = parseFloat(amount);
    const lastTx = await prisma.financialTransaction.findFirst({ orderBy: { receiptNumber: 'desc' } });
    const nextReceipt = (lastTx?.receiptNumber || 0) + 1;

    const transaction = await prisma.financialTransaction.create({
      data: {
        studentId: studentId || null,
        type: 'PAYMENT',
        amount: parsedAmount,
        paymentMethod: paymentMethod || 'CASH',
        status: 'COMPLETED',
        receiptNumber: nextReceipt,
        notes: `${beneficiary ? 'المستفيد: ' + beneficiary + ' — ' : ''}${notes || ''}`
      }
    });

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'Payment',
        details: JSON.stringify({ receiptNumber: nextReceipt, amount: parsedAmount, beneficiary })
      }
    });

    return res.json(transaction);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'فشل إنشاء سند الصرف' });
  }
});

// ==================== VOID TRANSACTION ====================
router.put('/:id/void', authMiddleware, requirePermission('finance.receipts'), async (req, res) => {
  try {
    const tx = await prisma.financialTransaction.update({
      where: { id: req.params.id },
      data: { status: 'VOIDED', notes: (req.body.reason ? 'ملغاة: ' + req.body.reason : 'ملغاة') }
    });
    return res.json(tx);
  } catch {
    return res.status(400).json({ error: 'فشل إلغاء المعاملة' });
  }
});

export default router;
