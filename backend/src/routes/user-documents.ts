import express from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const docs = await prisma.userDocument.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(docs);
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب المستندات' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, type, content } = req.body;
    const doc = await prisma.userDocument.create({
      data: {
        userId: user.id,
        title: title || 'مستند جديد',
        type: type || 'document',
        content: content || '',
      },
    });
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إنشاء المستند' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content } = req.body;
    const existing = await prisma.userDocument.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!existing) return res.status(404).json({ error: 'المستند غير موجود' });
    const updated = await prisma.userDocument.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'فشل تحديث المستند' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.userDocument.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!existing) return res.status(404).json({ error: 'المستند غير موجود' });
    await prisma.userDocument.delete({ where: { id: existing.id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'فشل حذف المستند' });
  }
});

export default router;
