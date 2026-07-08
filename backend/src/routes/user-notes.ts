import express from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const notes = await prisma.userNote.findMany({
      where: { userId: user.id },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    });
    return res.json(notes);
  } catch (e) {
    return res.status(500).json({ error: 'فشل جلب الملاحظات' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, color } = req.body;
    const note = await prisma.userNote.create({
      data: {
        userId: user.id,
        title: title || '',
        content: content || '',
        color: color || '#fef3c7',
      },
    });
    return res.json(note);
  } catch (e) {
    return res.status(500).json({ error: 'فشل إنشاء الملاحظة' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, color, pinned } = req.body;
    const existing = await prisma.userNote.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!existing) return res.status(404).json({ error: 'الملاحظة غير موجودة' });
    const updated = await prisma.userNote.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(pinned !== undefined ? { pinned } : {}),
      },
    });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'فشل تحديث الملاحظة' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.userNote.findFirst({
      where: { id: Number(req.params.id), userId: user.id },
    });
    if (!existing) return res.status(404).json({ error: 'الملاحظة غير موجودة' });
    await prisma.userNote.delete({ where: { id: existing.id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'فشل حذف الملاحظة' });
  }
});

export default router;
