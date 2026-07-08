import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const authUser = (req as any).user;
  const where: any = {};
  if (!authUser?.isAdmin && authUser?.role !== 'ADMIN') {
    let assignedIds: number[] = [];
    try { assignedIds = JSON.parse(authUser.assignedEntityIds || '[]'); } catch {}
    if (assignedIds.length > 0) where.id = { in: assignedIds };
  }
  const entities = await prisma.educationalEntity.findMany({
    where,
    include: { rooms: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(entities);
});

router.post('/', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    let notes = req.body.notes || '';
    if (req.body.address) notes += `\nالعنوان: ${req.body.address}`;
    if (req.body.contactName) notes += `\nالمسؤول: ${req.body.contactName}`;

    const data = {
      name: req.body.name,
      type: req.body.type || 'UNIVERSITY',
      status: req.body.status || 'ACTIVE',
      commissionType: req.body.commissionType || 'PERCENTAGE',
      uniPercentage: parseFloat(req.body.uniPercentage) || 0,
      fixedAmount: parseFloat(req.body.fixedAmount) || 0,
      roomAmount: parseFloat(req.body.roomAmount) || 0,
      contactPhone: req.body.phone || req.body.contactPhone || null,
      contactEmail: req.body.email || req.body.contactEmail || null,
      notes: notes || null
    };

    const entity = await prisma.educationalEntity.create({ data });
    res.json(entity);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'فشل إنشاء الجهة' });
  }
});

router.put('/:id', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    let notes = req.body.notes || '';
    if (req.body.address) notes += `\nالعنوان: ${req.body.address}`;
    if (req.body.contactName) notes += `\nالمسؤول: ${req.body.contactName}`;

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.type !== undefined) data.type = req.body.type;
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.commissionType !== undefined) data.commissionType = req.body.commissionType;
    if (req.body.uniPercentage !== undefined) data.uniPercentage = parseFloat(req.body.uniPercentage) || 0;
    if (req.body.fixedAmount !== undefined) data.fixedAmount = parseFloat(req.body.fixedAmount) || 0;
    if (req.body.roomAmount !== undefined) data.roomAmount = parseFloat(req.body.roomAmount) || 0;
    if (req.body.phone !== undefined || req.body.contactPhone !== undefined) {
      data.contactPhone = req.body.phone || req.body.contactPhone || null;
    }
    if (req.body.email !== undefined || req.body.contactEmail !== undefined) {
      data.contactEmail = req.body.email || req.body.contactEmail || null;
    }
    if (notes) data.notes = notes;

    const entity = await prisma.educationalEntity.update({ where: { id: parseInt(req.params.id as string) }, data });
    res.json(entity);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'فشل تحديث الجهة' });
  }
});

router.delete('/:id', authMiddleware, requirePermission('admin.entities'), async (req, res) => {
  try {
    await prisma.educationalEntity.delete({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch { res.status(400).json({ error: 'فشل حذف الجهة' }); }
});

export default router;
