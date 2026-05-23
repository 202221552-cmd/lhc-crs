import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { generateInstallments } from './installment';

const router = express.Router();

// ==================== DIPLOMA SUBSCRIPTIONS ====================

router.get('/diploma', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const { studentId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;

    const subs = await prisma.diplomaSubscription.findMany({
      where,
      include: { student: true, diploma: true, entity: true },
      orderBy: { date: 'desc' }
    });
    return res.json(subs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/diploma', authMiddleware, requirePermission('subscriptions.add'), async (req, res) => {
  try {
    const {
      studentId, diplomaId, entityId, studyType,
      baseFee, hasTransport, transportFee, hasSupplies, suppliesFee,
      discountType, discountValue, totalCost,
      paymentType, installmentsCount, firstInstallmentDate, notes
    } = req.body;

    if (!studentId || !diplomaId) return res.status(400).json({ error: 'الطالب والدبلوم مطلوبان' });

    const sub = await prisma.diplomaSubscription.create({
      data: {
        studentId, diplomaId, entityId: entityId || null, studyType: studyType || 'FACE_TO_FACE',
        baseFee: parseFloat(baseFee) || 0,
        hasTransport: !!hasTransport, transportFee: parseFloat(transportFee) || 0,
        hasSupplies: !!hasSupplies, suppliesFee: parseFloat(suppliesFee) || 0,
        discountType: discountType || 'NONE', discountValue: parseFloat(discountValue) || 0,
        totalCost: parseFloat(totalCost) || 0,
        paymentType: paymentType || 'FULL',
        installmentsCount: parseInt(installmentsCount) || 1,
        notes: notes || null
      },
      include: { student: true, diploma: true, entity: true }
    });

    // Generate installments
    const count = parseInt(installmentsCount) || 1;
    if (count >= 1 && parseFloat(totalCost) > 0) {
      const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();
      await generateInstallments(studentId, sub.id, 'DIPLOMA', parseFloat(totalCost), count, startDate);
    }

    // Audit
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'DiplomaSubscription',
        details: JSON.stringify({ studentId, diplomaId, totalCost })
      }
    });

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

    const sub = await prisma.diplomaSubscription.update({ where: { id: req.params.id }, data });
    return res.json(sub);
  } catch { return res.status(400).json({ error: 'فشل تحديث الاشتراك' }); }
});

router.delete('/diploma/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    await prisma.diplomaSubscription.update({ where: { id: req.params.id }, data: { status: 'CANCELED' } });
    // Cancel related installments
    await prisma.installment.updateMany({
      where: { subscriptionId: req.params.id, subscriptionType: 'DIPLOMA', status: 'PENDING' },
      data: { status: 'OVERDUE' }
    });
    return res.json({ success: true });
  } catch { return res.status(400).json({ error: 'فشل إلغاء الاشتراك' }); }
});

// ==================== COURSE SUBSCRIPTIONS ====================

router.get('/course', authMiddleware, requirePermission('subscriptions.view'), async (req, res) => {
  try {
    const { studentId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;

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

router.post('/course', authMiddleware, requirePermission('subscriptions.add'), async (req, res) => {
  try {
    const {
      studentId, courseId, entityId, studyType,
      baseFee, hasTransport, transportFee, hasSupplies, suppliesFee,
      discountType, discountValue, totalCost,
      paymentType, installmentsCount, firstInstallmentDate, notes
    } = req.body;

    if (!studentId || !courseId) return res.status(400).json({ error: 'الطالب والدورة مطلوبان' });

    const sub = await prisma.courseSubscription.create({
      data: {
        studentId, courseId, entityId: entityId || null, studyType: studyType || 'FACE_TO_FACE',
        baseFee: parseFloat(baseFee) || 0,
        hasTransport: !!hasTransport, transportFee: parseFloat(transportFee) || 0,
        hasSupplies: !!hasSupplies, suppliesFee: parseFloat(suppliesFee) || 0,
        discountType: discountType || 'NONE', discountValue: parseFloat(discountValue) || 0,
        totalCost: parseFloat(totalCost) || 0,
        paymentType: paymentType || 'FULL',
        installmentsCount: parseInt(installmentsCount) || 1,
        notes: notes || null
      },
      include: { student: true, course: true, entity: true }
    });

    // Generate installments
    const count = parseInt(installmentsCount) || 1;
    if (count >= 1 && parseFloat(totalCost) > 0) {
      const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();
      await generateInstallments(studentId, sub.id, 'COURSE', parseFloat(totalCost), count, startDate);
    }

    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: {
        userId: actingUser.id, action: 'CREATE', entity: 'CourseSubscription',
        details: JSON.stringify({ studentId, courseId, totalCost })
      }
    });

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

    const sub = await prisma.courseSubscription.update({ where: { id: req.params.id }, data });
    return res.json(sub);
  } catch { return res.status(400).json({ error: 'فشل تحديث الاشتراك' }); }
});

router.delete('/course/:id', authMiddleware, requirePermission('subscriptions.edit'), async (req, res) => {
  try {
    await prisma.courseSubscription.update({ where: { id: req.params.id }, data: { status: 'CANCELED' } });
    await prisma.installment.updateMany({
      where: { subscriptionId: req.params.id, subscriptionType: 'COURSE', status: 'PENDING' },
      data: { status: 'OVERDUE' }
    });
    return res.json({ success: true });
  } catch { return res.status(400).json({ error: 'فشل إلغاء الاشتراك' }); }
});

export default router;
