import express from 'express';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/settings', authMiddleware, requirePermission('admin.settings'), async (req, res) => {
  try {
    const settings = await prisma.whatsAppSetting.findMany();
    const result: Record<string, string | null> = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch { res.status(400).json({ error: 'فشل تحميل إعدادات الواتساب' }); }
});

router.put('/settings', authMiddleware, requirePermission('admin.settings'), async (req, res) => {
  try {
    const entries = req.body;
    for (const [key, value] of Object.entries(entries)) {
      await prisma.whatsAppSetting.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      });
    }
    const settings = await prisma.whatsAppSetting.findMany();
    const result: Record<string, string | null> = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch { res.status(400).json({ error: 'فشل حفظ إعدادات الواتساب' }); }
});

router.post('/send', authMiddleware, requirePermission('students.view'), async (req, res) => {
  try {
    const { recipientPhone, recipientName, message } = req.body;
    if (!recipientPhone || !message) {
      return res.status(400).json({ error: 'رقم الهاتف والرسالة مطلوبان' });
    }
    const whatsappSetting = await prisma.whatsAppSetting.findUnique({ where: { key: 'api_url' } });
    const apiToken = await prisma.whatsAppSetting.findUnique({ where: { key: 'api_token' } });
    const msg = await prisma.whatsAppMessage.create({
      data: { recipientPhone, recipientName, message, status: 'PENDING' },
    });
    if (whatsappSetting?.value && apiToken?.value) {
      try {
        const response = await fetch(whatsappSetting.value, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken.value}`,
          },
          body: JSON.stringify({
            phone: recipientPhone,
            message,
            recipientName: recipientName || '',
          }),
        });
        if (response.ok) {
          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          const errText = await response.text();
          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: { status: 'FAILED', errorMessage: errText },
          });
        }
      } catch (err: any) {
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: { status: 'FAILED', errorMessage: err.message },
        });
      }
    }
    const updated = await prisma.whatsAppMessage.findUnique({ where: { id: msg.id } });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل إرسال الرسالة' });
  }
});

router.get('/messages', authMiddleware, requirePermission('admin.settings'), async (req, res) => {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(messages);
  } catch { res.status(400).json({ error: 'فشل تحميل الرسائل' }); }
});

export default router;
