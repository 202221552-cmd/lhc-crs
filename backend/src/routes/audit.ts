import express from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, requirePermission('admin.audit'), async (req, res) => {
  try {
    const { limit, entity, action } = req.query;
    const where: any = {};
    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 200
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب سجل النشاط' });
  }
});

router.delete('/', authMiddleware, requirePermission('ADMIN_ALL'), async (req, res) => {
  try {
    await prisma.auditLog.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل مسح السجل' });
  }
});

export default router;
