import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

// ==================== GET ALL ANNOUNCEMENTS (admin) ====================
router.get('/', authMiddleware, requirePermission('admin.announcements'), async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { reads: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(announcements);
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب الإعلانات' });
  }
});

// ==================== CREATE ANNOUNCEMENT ====================
router.post('/', authMiddleware, requirePermission('admin.announcements'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, type, status, targetRoles, targetUserIds, startAt, endAt } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });

    const data: any = {
      title,
      content,
      type: type || 'NORMAL',
      status: status || 'DRAFT',
      targetRoles: JSON.stringify(targetRoles || []),
      targetUserIds: JSON.stringify(targetUserIds || []),
      createdById: user.id,
      startAt: startAt ? new Date(startAt) : new Date(),
    };
    if (endAt) data.endAt = new Date(endAt);
    if (status === 'PUBLISHED') data.publishedAt = new Date();

    const announcement = await prisma.announcement.create({ data });
    return res.json(announcement);
  } catch (e: any) {
    return res.status(400).json({ error: 'فشل إنشاء الإعلان' });
  }
});

// ==================== UPDATE ANNOUNCEMENT ====================
router.put('/:id', authMiddleware, requirePermission('admin.announcements'), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, content, type, status, targetRoles, targetUserIds, startAt, endAt } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (targetRoles !== undefined) data.targetRoles = JSON.stringify(targetRoles);
    if (targetUserIds !== undefined) data.targetUserIds = JSON.stringify(targetUserIds);
    if (startAt !== undefined) data.startAt = new Date(startAt);
    if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'الإعلان غير موجود' });

    // If publishing now
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      data.publishedAt = new Date();
    }

    const announcement = await prisma.announcement.update({ where: { id }, data });
    return res.json(announcement);
  } catch (e: any) {
    return res.status(400).json({ error: 'فشل تحديث الإعلان' });
  }
});

// ==================== DELETE ANNOUNCEMENT ====================
router.delete('/:id', authMiddleware, requirePermission('admin.announcements'), async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: parseInt(req.params.id as string) } });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل حذف الإعلان' });
  }
});

// ==================== GET ACTIVE ANNOUNCEMENTS FOR CURRENT USER ====================
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        startAt: { lte: now },
        AND: [
          { OR: [{ endAt: null }, { endAt: { gte: now } }] }
        ]
      },
      include: {
        reads: { where: { userId: user.id } },
        _count: { select: { reads: true } }
      },
      orderBy: [{ type: 'desc' }, { publishedAt: 'desc' }]
    });

    // Filter by target roles / users
    const filtered = announcements.filter(a => {
      let roles: string[] = [];
      let userIds: number[] = [];
      try { roles = JSON.parse(a.targetRoles); } catch {}
      try { userIds = JSON.parse(a.targetUserIds); } catch {}

      // Specific users
      if (userIds.length > 0) return userIds.includes(user.id);
      // Specific roles (empty = all)
      if (roles.length > 0) return roles.includes(user.role);
      return true;
    });

    return res.json(filtered.map(a => ({
      ...a,
      read: a.reads.length > 0,
      reads: undefined
    })));
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب الإعلانات النشطة' });
  }
});

// ==================== MARK AS READ ====================
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id as string);
    await prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId: user.id } },
      update: { readAt: new Date() },
      create: { announcementId: id, userId: user.id }
    });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل تحديث حالة القراءة' });
  }
});

export default router;
