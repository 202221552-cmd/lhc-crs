import express from 'express';
import { prisma } from '../index.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { generateInstallments } from './installment.js';

const router = express.Router();

// ===== Point System Helper =====
// Award points up the chain: registrar → supervisor → team leader
async function awardPoints(studentId: string): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { registeredByUserId: true, markerEmployeeId: true }
    });
    if (!student) return;

    let registrarUserId = student.registeredByUserId;
    // Fallback: if registeredByUserId not set, look up via markerEmployeeId -> employeeId -> User
    if (!registrarUserId && student.markerEmployeeId) {
      const empUser = await prisma.user.findFirst({
        where: { employeeId: student.markerEmployeeId },
        select: { id: true }
      });
      if (empUser) registrarUserId = empUser.id;
    }
    if (!registrarUserId) return;

    const usersToAward: number[] = [registrarUserId];
    const registrar = await prisma.user.findUnique({
      where: { id: registrarUserId },
      select: { supervisorId: true, teamLeaderId: true }
    });
    if (registrar?.supervisorId) usersToAward.push(registrar.supervisorId);
    if (registrar?.teamLeaderId && !usersToAward.includes(registrar.teamLeaderId)) {
      usersToAward.push(registrar.teamLeaderId);
    }
    // Also check if supervisor has a team leader (in case teamLeaderId wasn't set on registrar)
    if (registrar?.supervisorId) {
      const supervisor = await prisma.user.findUnique({
        where: { id: registrar.supervisorId },
        select: { teamLeaderId: true }
      });
      if (supervisor?.teamLeaderId && !usersToAward.includes(supervisor.teamLeaderId)) {
        usersToAward.push(supervisor.teamLeaderId);
      }
    }

    for (const userId of usersToAward) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 1 } }
      });
    }
  } catch (err) {
    console.error('Failed to award points:', err);
  }
}

// Get total count of subscriptions (course + diploma)
router.get('/', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const [courseCount, diplomaCount] = await Promise.all([
      prisma.courseSubscription.count(),
      prisma.diplomaSubscription.count()
    ]);
    return res.json({ total: courseCount + diplomaCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== DIPLOMA SUBSCRIPTIONS ====================

router.get('/diploma', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const { studentId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;

    const subs = await prisma.diplomaSubscription.findMany({
      where,
      include: {
        student: true,
        diploma: { include: { courses: { include: { course: true }, orderBy: { order: 'asc' } } } },
        entity: true
      },
      orderBy: { date: 'desc' }
    });
    return res.json(subs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function getMinPaymentCheck(studentId: string, programId: string, type: 'DIPLOMA' | 'COURSE'): Promise<{ ok: boolean; paid: number; required: number }> {
  const program = type === 'DIPLOMA'
    ? await prisma.diploma.findUnique({ where: { id: programId }, select: { minPayment: true } })
    : await prisma.course.findUnique({ where: { id: programId }, select: { minPayment: true } });
  const minPayment = program?.minPayment || 0;
  if (minPayment <= 0) return { ok: true, paid: 0, required: 0 };

  const subs = type === 'DIPLOMA'
    ? await prisma.diplomaSubscription.findMany({ where: { studentId, diplomaId: programId }, select: { id: true } })
    : await prisma.courseSubscription.findMany({ where: { studentId, courseId: programId }, select: { id: true } });
  const subIds = subs.map(s => String(s.id));

  const installments = await prisma.installment.findMany({
    where: { studentId, subscriptionId: { in: subIds }, subscriptionType: type, status: 'PAID' }
  });
  const paid = installments.reduce((sum, inst) => sum + inst.amount, 0);
  return { ok: paid >= minPayment, paid, required: minPayment };
}

async function createFirstInstallmentPayment(
  studentId: string, subId: string, subType: 'DIPLOMA' | 'COURSE',
  installmentId: number, amount: number, paymentMethod: string,
  reference: string, paymentDest?: string, paymentSubMethod?: string,
  paymentWalletRef?: string, paymentBank?: string,
  checkNumber?: string, hawalaNumber?: string
) {
  const receiptNumber = await generateReceiptNumber('RECEIPT');
  await prisma.financialTransaction.create({
    data: {
      studentId,
      subscriptionId: subId,
      subscriptionType: subType,
      installmentId,
      type: 'RECEIPT',
      amount,
      paymentMethod: paymentMethod || 'CASH',
      status: 'COMPLETED',
      receiptNumber,
      referenceNumber: reference || null,
      paymentDest: paymentDest || null,
      paymentSubMethod: paymentSubMethod || null,
      paymentWalletRef: paymentWalletRef || null,
      paymentBank: paymentBank || null,
      checkNumber: checkNumber || null,
      hawalaNumber: hawalaNumber || null,
      notes: `دفعة أولى عند التسجيل`
    }
  });
}

router.post('/diploma', authMiddleware, requirePermission('subscriptions.add'), async (req, res) => {
  try {
    const {
      studentId, diplomaId, entityId, studyType,
      baseFee, hasTransport, transportFee, hasSupplies, suppliesFee,
      discountType, discountValue, totalCost,
      paymentType, installmentsCount, notes,
      minPaymentException,
      firstInstallmentAmount, firstInstallmentPaid,
      firstPaymentMethod, firstPaymentRef,
      firstPaymentDest, firstPaymentSubMethod, firstPaymentWalletRef,
      firstPaymentBank, firstPaymentCheckNum, firstPaymentHawalaNum,
      installmentDates, installmentAmounts
    } = req.body;

    if (!studentId || !diplomaId) return res.status(400).json({ error: 'الطالب والدبلوم مطلوبان' });

    // Validate reference uniqueness
    if (firstInstallmentPaid && firstPaymentRef) {
      const existingTx = await prisma.financialTransaction.findFirst({ where: { referenceNumber: firstPaymentRef } });
      if (existingTx) return res.status(400).json({ error: 'رقم المرجع موجود مسبقاً — الرجاء استخدام رقم مرجع آخر' });
    }

    let resolvedEntityId = entityId ? parseInt(entityId) : null;
    if (!resolvedEntityId) {
      const dip = await prisma.diploma.findUnique({ where: { id: diplomaId }, select: { entityId: true } });
      if (dip?.entityId) resolvedEntityId = dip.entityId;
    }

    const existing = await prisma.diplomaSubscription.findFirst({
      where: { studentId, diplomaId, status: { in: ['ACTIVE', 'PENDING'] } }
    });
    if (existing) {
      return res.status(400).json({ error: 'هذا الطالب مسجّل بالفعل في هذا الدبلوم. يجب إنهاء الدبلوم الحالي أولاً' });
    }

    const sub = await prisma.diplomaSubscription.create({
      data: {
        studentId, diplomaId, entityId: resolvedEntityId, studyType: studyType || 'FACE_TO_FACE',
        baseFee: parseFloat(baseFee) || 0,
        hasTransport: !!hasTransport, transportFee: parseFloat(transportFee) || 0,
        hasSupplies: !!hasSupplies, suppliesFee: parseFloat(suppliesFee) || 0,
        discountType: discountType || 'NONE', discountValue: parseFloat(discountValue) || 0,
        totalCost: parseFloat(totalCost) || 0,
        minPaymentException: !!minPaymentException,
        paymentType: paymentType || 'INSTALLMENTS',
        installmentsCount: parseInt(installmentsCount) || 1,
        notes: notes || null
      },
      include: { student: true, diploma: true, entity: true }
    });

    // Generate installments with per-date and per-amount support
    const count = parseInt(installmentsCount) || 1;
    const total = parseFloat(totalCost) || 0;
    const firstAmt = firstInstallmentAmount ? parseFloat(firstInstallmentAmount) : total;
    if (count >= 1 && total > 0) {
      const instDates: string[] = Array.isArray(installmentDates) ? installmentDates : [];
      const instAmounts: number[] = Array.isArray(installmentAmounts) ? installmentAmounts.map(Number) : [];
      // If custom amounts provided, use them directly
      const amounts = instAmounts.length === count ? instAmounts : undefined;
      const createdInsts = await generateInstallments(
        studentId, String(sub.id), 'DIPLOMA', total, count,
        new Date(), firstAmt, instDates, amounts
      );

      if (firstInstallmentPaid && createdInsts.length > 0) {
        await createFirstInstallmentPayment(
          studentId, String(sub.id), 'DIPLOMA',
          createdInsts[0].id, createdInsts[0].amount,
          firstPaymentMethod || 'CASH',
          firstPaymentRef || '',
          firstPaymentDest, firstPaymentSubMethod, firstPaymentWalletRef,
          firstPaymentBank, firstPaymentCheckNum, firstPaymentHawalaNum
        );
        const remaining = Math.max(0, createdInsts[0].amount - createdInsts[0].amount);
        await prisma.installment.update({
          where: { id: createdInsts[0].id },
          data: {
            paidAmount: createdInsts[0].amount,
            remainingAmount: 0,
            status: 'PAID',
            paymentDate: new Date(),
            paymentMethod: firstPaymentMethod || 'CASH',
            paymentDest: firstPaymentDest || null,
            paymentSubMethod: firstPaymentSubMethod || null,
            paymentWalletRef: firstPaymentWalletRef || null,
            paymentBank: firstPaymentBank || null,
            checkNumber: firstPaymentCheckNum || null,
            hawalaNumber: firstPaymentHawalaNum || null,
          }
        });
      }
    }

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'DiplomaSubscription',
        details: JSON.stringify({ studentId, diplomaId, totalCost, firstInstallmentPaid: !!firstInstallmentPaid })
      }
    });

    // Award points up the chain
    await awardPoints(studentId);

    return res.status(201).json(sub);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'فشل إنشاء اشتراك الدبلوم' });
  }
});

router.put('/diploma/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.studentId; delete data.diplomaId;
    if (data.totalCost) data.totalCost = parseFloat(data.totalCost);
    if (data.baseFee) data.baseFee = parseFloat(data.baseFee);

    const sub = await prisma.diplomaSubscription.update({ where: { id: parseInt(req.params.id as string) }, data });
    return res.json(sub);
  } catch { return res.status(400).json({ error: 'فشل تحديث الاشتراك' }); }
});

router.delete('/diploma/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    await prisma.diplomaSubscription.update({ where: { id: parseInt(req.params.id as string) }, data: { status: 'CANCELED' } });
    // Cancel related installments
    await prisma.installment.updateMany({
      where: { subscriptionId: (req.params.id as string), subscriptionType: 'DIPLOMA', status: 'PENDING' },
      data: { status: 'OVERDUE' }
    });
    return res.json({ success: true });
  } catch { return res.status(400).json({ error: 'فشل إلغاء الاشتراك' }); }
});

// ==================== COURSE SUBSCRIPTIONS ====================

router.get('/course', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (courseId) where.courseId = courseId as string;

    const subs = await prisma.courseSubscription.findMany({
      where,
      include: { student: true, course: true, entity: true },
      orderBy: { date: 'desc' }
    });
    return res.json(subs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== ELIGIBLE STUDENTS (course subs + diploma subs) ====================
router.get('/eligible-students', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const { courseId, diplomaId } = req.query;
    if (!courseId) return res.status(400).json({ error: 'معرف الدورة مطلوب' });

    const studentMap = new Map<string, any>();

    // If diplomaId is provided, only show students from that diploma
    if (diplomaId) {
      const subs = await prisma.diplomaSubscription.findMany({
        where: { diplomaId: diplomaId as string },
        include: { student: true },
      });
      for (const sub of subs) {
        if (sub.student) studentMap.set(sub.student.id, sub.student);
      }
    } else {
      // No diploma: only course subscribers (course-direct students)
      const subs = await prisma.courseSubscription.findMany({
        where: { courseId: courseId as string },
        include: { student: true },
      });
      for (const sub of subs) {
        if (sub.student) studentMap.set(sub.student.id, sub.student);
      }
    }

    return res.json(Array.from(studentMap.values()));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/course', authMiddleware, requirePermission('subscriptions.add'), async (req, res) => {
  try {
    const {
      studentId, courseId, entityId, studyType,
      baseFee, hasTransport, transportFee, hasSupplies, suppliesFee,
      discountType, discountValue, totalCost,
      paymentType, installmentsCount, notes,
      minPaymentException,
      firstInstallmentAmount, firstInstallmentPaid,
      firstPaymentMethod, firstPaymentRef,
      firstPaymentDest, firstPaymentSubMethod, firstPaymentWalletRef,
      firstPaymentBank, firstPaymentCheckNum, firstPaymentHawalaNum,
      installmentDates, installmentAmounts
    } = req.body;

    if (!studentId || !courseId) return res.status(400).json({ error: 'الطالب والدورة مطلوبان' });

    // Validate reference uniqueness
    if (firstInstallmentPaid && firstPaymentRef) {
      const existingTx = await prisma.financialTransaction.findFirst({ where: { referenceNumber: firstPaymentRef } });
      if (existingTx) return res.status(400).json({ error: 'رقم المرجع موجود مسبقاً — الرجاء استخدام رقم مرجع آخر' });
    }

    let resolvedEntityId = entityId ? parseInt(entityId) : null;
    if (!resolvedEntityId) {
      const crs = await prisma.course.findUnique({ where: { id: courseId }, select: { entityId: true } });
      if (crs?.entityId) resolvedEntityId = crs.entityId;
    }

    const existingCourse = await prisma.courseSubscription.findFirst({
      where: { studentId, courseId, status: 'ACTIVE' }
    });
    if (existingCourse) {
      return res.status(400).json({ error: 'هذا الطالب مسجّل بالفعل في هذه الدورة (فعالة). يجب إنهاؤها أولاً' });
    }

    const sub = await prisma.courseSubscription.create({
      data: {
        studentId, courseId, entityId: resolvedEntityId, studyType: studyType || 'FACE_TO_FACE',
        baseFee: parseFloat(baseFee) || 0,
        hasTransport: !!hasTransport, transportFee: parseFloat(transportFee) || 0,
        hasSupplies: !!hasSupplies, suppliesFee: parseFloat(suppliesFee) || 0,
        discountType: discountType || 'NONE', discountValue: parseFloat(discountValue) || 0,
        totalCost: parseFloat(totalCost) || 0,
        minPaymentException: !!minPaymentException,
        paymentType: paymentType || 'INSTALLMENTS',
        installmentsCount: parseInt(installmentsCount) || 1,
        notes: notes || null
      },
      include: { student: true, course: true, entity: true }
    });

    // Auto-enroll in first available section
    const minOk = minPaymentException ? { ok: true } : await getMinPaymentCheck(studentId, courseId, 'COURSE');
    if (courseId && minOk.ok) {
      const section = await prisma.section.findFirst({ where: { courseId, status: 'OPEN' } });
      if (section) {
        await prisma.studentSection.upsert({
          where: { studentId_sectionId: { studentId, sectionId: section.id } },
          update: {},
          create: { studentId, sectionId: section.id }
        });
      }
    }

    // Generate installments
    const count = parseInt(installmentsCount) || 1;
    const total = parseFloat(totalCost) || 0;
    const firstAmt = firstInstallmentAmount ? parseFloat(firstInstallmentAmount) : total;
    if (count >= 1 && total > 0) {
      const instDates: string[] = Array.isArray(installmentDates) ? installmentDates : [];
      const instAmounts: number[] = Array.isArray(installmentAmounts) ? installmentAmounts.map(Number) : [];
      const amounts = instAmounts.length === count ? instAmounts : undefined;
      const createdInsts = await generateInstallments(
        studentId, String(sub.id), 'COURSE', total, count,
        new Date(), firstAmt, instDates, amounts
      );

      if (firstInstallmentPaid && createdInsts.length > 0) {
        await createFirstInstallmentPayment(
          studentId, String(sub.id), 'COURSE',
          createdInsts[0].id, createdInsts[0].amount,
          firstPaymentMethod || 'CASH',
          firstPaymentRef || '',
          firstPaymentDest, firstPaymentSubMethod, firstPaymentWalletRef,
          firstPaymentBank, firstPaymentCheckNum, firstPaymentHawalaNum
        );
        await prisma.installment.update({
          where: { id: createdInsts[0].id },
          data: {
            paidAmount: createdInsts[0].amount,
            remainingAmount: 0,
            status: 'PAID',
            paymentDate: new Date(),
            paymentMethod: firstPaymentMethod || 'CASH',
            paymentDest: firstPaymentDest || null,
            paymentSubMethod: firstPaymentSubMethod || null,
            paymentWalletRef: firstPaymentWalletRef || null,
            paymentBank: firstPaymentBank || null,
            checkNumber: firstPaymentCheckNum || null,
            hawalaNumber: firstPaymentHawalaNum || null,
          }
        });
      }
    }

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'CourseSubscription',
        details: JSON.stringify({ studentId, courseId, totalCost, firstInstallmentPaid: !!firstInstallmentPaid })
      }
    });

    // Award points up the chain
    await awardPoints(studentId);

    return res.status(201).json(sub);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'فشل إنشاء اشتراك الدورة' });
  }
});

router.put('/course/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.studentId; delete data.courseId;
    if (data.totalCost) data.totalCost = parseFloat(data.totalCost);

    const sub = await prisma.courseSubscription.update({ where: { id: parseInt(req.params.id as string) }, data });
    return res.json(sub);
  } catch { return res.status(400).json({ error: 'فشل تحديث الاشتراك' }); }
});

router.delete('/course/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    await prisma.courseSubscription.update({ where: { id: parseInt(req.params.id as string) }, data: { status: 'CANCELED' } });
    await prisma.installment.updateMany({
      where: { subscriptionId: (req.params.id as string), subscriptionType: 'COURSE', status: 'PENDING' },
      data: { status: 'OVERDUE' }
    });
    return res.json({ success: true });
  } catch { return res.status(400).json({ error: 'فشل إلغاء الاشتراك' }); }
});

export default router;
