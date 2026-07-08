import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { generateReceiptNumber } from '../utils/generateReceiptNumber';

const router = express.Router();

// ==================== ENTITY CLAIMS ====================

// GET /api/fin-accounts/claims — list claims with filters
router.get('/claims', authMiddleware, requirePermission('finance.claims'), async (req, res) => {
  try {
    const { entityId, status, month, year, studentId } = req.query;
    const where: any = {};
    if (entityId) where.entityId = parseInt(entityId as string);
    if (status) where.status = status as string;
    if (month) where.periodMonth = parseInt(month as string);
    if (year) where.periodYear = parseInt(year as string);
    if (studentId) where.studentId = studentId as string;

    const claims = await prisma.entityClaim.findMany({
      where,
      include: {
        entity: { select: { id: true, name: true, commissionType: true, uniPercentage: true, fixedAmount: true, roomAmount: true } },
        student: { select: { id: true, fullNameAr: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(claims);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fin-accounts/claims/generate — generate claims for an entity
router.post('/claims/generate', authMiddleware, requirePermission('finance.claims'), async (req, res) => {
  try {
    const { entityId, periodMonth, periodYear } = req.body;
    if (!entityId || !periodMonth || !periodYear) {
      return res.status(400).json({ error: 'entityId, periodMonth, periodYear مطلوبون' });
    }

    const entity = await prisma.educationalEntity.findUnique({ where: { id: parseInt(entityId) } });
    if (!entity) return res.status(404).json({ error: 'الجهة غير موجودة' });

    // Find all active subscriptions for this entity
    const [diplomaSubs, courseSubs] = await Promise.all([
      prisma.diplomaSubscription.findMany({
        where: { entityId: entity.id, status: 'ACTIVE' },
        include: { student: true, diploma: true }
      }),
      prisma.courseSubscription.findMany({
        where: { entityId: entity.id, status: 'ACTIVE' },
        include: { student: true, course: true }
      })
    ]);

    const claims: any[] = [];

    for (const sub of [...diplomaSubs, ...courseSubs]) {
      const totalFees = sub.totalCost;
      const subscriptionId = String(sub.id);
      const subscriptionType = (sub as any).diplomaId ? 'DIPLOMA' : 'COURSE';

      // Get installments for this subscription
      const installments = await prisma.installment.findMany({
        where: { subscriptionId, subscriptionType }
      });

      const totalPaid = installments.reduce((s, i) => s + i.paidAmount, 0);
      const paidInstallments = installments.filter(i => i.status === 'PAID').length;

      // Calculate entity share based on commissionType
      let entityShare = 0;
      switch (entity.commissionType) {
        case 'PERCENTAGE':
          entityShare = (totalFees * entity.uniPercentage) / 100;
          break;
        case 'FIXED_PER_STUDENT':
          entityShare = entity.fixedAmount;
          break;
        case 'PER_ROOM':
          entityShare = entity.roomAmount;
          break;
        case 'PERCENTAGE_AND_FIXED':
          entityShare = (totalFees * entity.uniPercentage) / 100 + entity.fixedAmount;
          break;
        case 'PERCENTAGE_AND_ROOM':
          entityShare = (totalFees * entity.uniPercentage) / 100 + entity.roomAmount;
          break;
        case 'FIXED_AND_ROOM':
          entityShare = entity.fixedAmount + entity.roomAmount;
          break;
        default:
          entityShare = (totalFees * entity.uniPercentage) / 100;
      }

      const centerShare = totalFees - entityShare;
      const claimAmount = totalPaid > 0 ? Math.min(entityShare, totalPaid) : 0;

      // Upsert claim: update if exists for this student+entity+period
      const existing = await prisma.entityClaim.findFirst({
        where: {
          entityId: entity.id,
          studentId: sub.studentId,
          subscriptionId,
          periodMonth: parseInt(periodMonth),
          periodYear: parseInt(periodYear)
        }
      });

      const claimData = {
        entityId: entity.id,
        studentId: sub.studentId,
        subscriptionId,
        subscriptionType,
        totalFees,
        entityShare,
        centerShare,
        paidInstallments,
        totalPaid,
        claimAmount,
        status: 'PENDING' as const,
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear)
      };

      if (existing) {
        const updated = await prisma.entityClaim.update({ where: { id: existing.id }, data: claimData });
        claims.push(updated);
      } else {
        const created = await prisma.entityClaim.create({ data: claimData });
        claims.push(created);
      }
    }

    res.json({ message: `تم إنشاء/تحديث ${claims.length} مطالبة`, claims });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fin-accounts/claims/:id/pay — mark claim as paid
router.put('/claims/:id/pay', authMiddleware, requirePermission('finance.claims'), async (req, res) => {
  try {
    const claim = await prisma.entityClaim.update({
      where: { id: parseInt(req.params.id as string) },
      data: { status: 'PAID' }
    });
    res.json(claim);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LECTURER PAYMENTS ====================

// GET /api/fin-accounts/lecturers — lecturer summary with payments
router.get('/lecturers', authMiddleware, requirePermission('finance.accounts'), async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        sections: {
          where: { status: { not: 'CLOSED' } },
          include: { course: { select: { id: true, name: true } } }
        },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { name: 'asc' }
    });

    const result = instructors.map(inst => {
      const courseRate = inst.courseRate;
      const activeSections = inst.sections.length;
      const totalDue = activeSections * courseRate;
      const paidAmount = inst.payments
        .filter(p => p.status === 'PAID')
        .reduce((s, p) => s + p.amount, 0);
      const pendingAmount = inst.payments
        .filter(p => p.status === 'PENDING')
        .reduce((s, p) => s + p.amount, 0);

      return {
        id: inst.id,
        name: inst.name,
        specialization: inst.specialization,
        phone: inst.phone,
        courseRate,
        paymentMethod: inst.paymentMethod,
        iban: inst.iban,
        activeSections,
        totalDue,
        paidAmount,
        pendingAmount,
        sections: inst.sections.map(s => ({
          id: s.id,
          courseId: s.courseId,
          courseName: (s as any).course?.name
        })),
        payments: inst.payments
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fin-accounts/lecturers/pay — create or pay a lecturer payment
router.post('/lecturers/pay', authMiddleware, requirePermission('finance.accounts'), async (req, res) => {
  try {
    const { instructorId, sectionId, courseId, amount, paymentMethod, notes } = req.body;
    if (!instructorId || !sectionId || !courseId || !amount) {
      return res.status(400).json({ error: 'instructorId, sectionId, courseId, amount مطلوبون' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ غير صالح' });
    }

    // Check if payment already exists for this instructor+section
    const existing = await prisma.instructorPayment.findUnique({
      where: { instructorId_sectionId: { instructorId: parseInt(instructorId), sectionId: parseInt(sectionId) } }
    });

    let payment;
    if (existing) {
      payment = await prisma.instructorPayment.update({
        where: { id: existing.id },
        data: {
          amount: parsedAmount,
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || null
        }
      });
    } else {
      payment = await prisma.instructorPayment.create({
        data: {
          instructorId: parseInt(instructorId),
          sectionId: parseInt(sectionId),
          courseId,
          amount: parsedAmount,
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || null
        }
      });
    }

    // Also create a PAYMENT financial transaction record
    const instructor = await prisma.instructor.findUnique({ where: { id: parseInt(instructorId) } });
    const receiptNumber = await generateReceiptNumber('PAYMENT');

    await prisma.financialTransaction.create({
      data: {
        type: 'PAYMENT',
        amount: parsedAmount,
        paymentMethod: paymentMethod || 'CASH',
        status: 'COMPLETED',
        receiptNumber,
        notes: `أجر محاضر: ${instructor?.name || ''} - دورة ${courseId}`,
        lecturerCost: parsedAmount
      }
    });

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fin-accounts/lecturers/pay-bulk — pay multiple lecturers at once
router.post('/lecturers/pay-bulk', authMiddleware, requirePermission('finance.accounts'), async (req, res) => {
  try {
    const { payments } = req.body; // array of { instructorId, sectionId, courseId, amount, paymentMethod }
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'مصفوفة payments مطلوبة' });
    }

    const results = [];
    for (const p of payments) {
      const parsedAmount = parseFloat(p.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) continue;

      const existing = await prisma.instructorPayment.findUnique({
        where: { instructorId_sectionId: { instructorId: parseInt(p.instructorId), sectionId: parseInt(p.sectionId) } }
      });

      if (existing) {
        results.push(await prisma.instructorPayment.update({
          where: { id: existing.id },
          data: { amount: parsedAmount, status: 'PAID', paidDate: new Date(), paymentMethod: p.paymentMethod || 'CASH' }
        }));
      } else {
        results.push(await prisma.instructorPayment.create({
          data: {
            instructorId: parseInt(p.instructorId),
            sectionId: parseInt(p.sectionId),
            courseId: p.courseId,
            amount: parsedAmount,
            status: 'PAID',
            paidDate: new Date(),
            paymentMethod: p.paymentMethod || 'CASH'
          }
        }));
      }

      const instructor = await prisma.instructor.findUnique({ where: { id: parseInt(p.instructorId) } });
      const receiptNumber = await generateReceiptNumber('PAYMENT');
      await prisma.financialTransaction.create({
        data: {
          type: 'PAYMENT',
          amount: parsedAmount,
          paymentMethod: p.paymentMethod || 'CASH',
          status: 'COMPLETED',
          receiptNumber,
          notes: `أجر محاضر: ${instructor?.name || ''} - دورة ${p.courseId}`,
          lecturerCost: parsedAmount
        }
      });
    }

    res.json({ message: `تم صرف ${results.length} دفعة`, payments: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
