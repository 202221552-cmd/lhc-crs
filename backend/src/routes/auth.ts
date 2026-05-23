import express from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ems-super-secret-2026';

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { permissions: { include: { permission: true } } }
    });

    if (!user) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'هذا الحساب معطّل. يرجى التواصل مع المسؤول.' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const deviceType = req.headers['user-agent'] || '';

    // Enforce device limit — revoke oldest sessions
    const activeSessions = await prisma.loginSession.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { lastActive: 'asc' }
    });
    if (activeSessions.length >= user.maxDevicesAllowed) {
      const toRevoke = activeSessions.slice(0, activeSessions.length - user.maxDevicesAllowed + 1);
      await prisma.loginSession.updateMany({
        where: { id: { in: toRevoke.map(s => s.id) } },
        data: { status: 'REVOKED' }
      });
    }

    // Build permissions list (dot-notation keys)
    const permKeys = user.permissions.map(p => p.permission.name);
    const isAdmin = permKeys.includes('ADMIN_ALL') || user.role === 'ADMIN';

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.loginSession.create({
      data: { userId: user.id, token, ipAddress, deviceType }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'Session',
        details: JSON.stringify({ username, ip: ipAddress, device: deviceType.substring(0, 120) }),
        ipAddress,
        deviceType: deviceType.substring(0, 120)
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isAdmin,
        permissions: isAdmin ? ['ADMIN_ALL'] : permKeys,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('LOGIN ERROR:', error?.message, error?.code, error?.stack?.slice(0, 300));
    return res.status(500).json({ error: 'خطأ داخلي في الخادم', detail: error?.message });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await prisma.loginSession.updateMany({ where: { token }, data: { status: 'REVOKED' } });
      const u = (req as any).user;
      if (u) {
        await prisma.auditLog.create({
          data: { userId: u.id, action: 'LOGOUT', entity: 'Session', details: JSON.stringify({ username: u.username }) }
        });
      }
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ داخلي' });
  }
});

// ==================== ME ====================
router.get('/me', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const permKeys = user.permissions.map((p: any) => p.permission.name);
  const isAdmin = permKeys.includes('ADMIN_ALL') || user.role === 'ADMIN';
  return res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isAdmin,
    permissions: isAdmin ? ['ADMIN_ALL'] : permKeys,
    status: user.status
  });
});

// ==================== GET ALL USERS (admin only) ====================
router.get('/users', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      permissions: { include: { permission: true } },
      loginSessions: { where: { status: 'ACTIVE' } }
    },
    orderBy: { createdAt: 'asc' }
  });
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    status: u.status,
    maxDevicesAllowed: u.maxDevicesAllowed,
    activeSessionsCount: u.loginSessions.length,
    permissions: u.permissions.map(p => p.permission.name),
    createdAt: u.createdAt
  }));
  return res.json(safeUsers);
});

// ==================== CREATE USER ====================
router.post('/users', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const { username, password, fullName, role, maxDevicesAllowed, permissions, status } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'الحقول الإجبارية مفقودة' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        passwordHash,
        fullName,
        role: role || 'EMPLOYEE',
        status: status || 'ACTIVE',
        maxDevicesAllowed: maxDevicesAllowed || 3
      }
    });
    if (permissions && Array.isArray(permissions)) {
      for (const pk of permissions) {
        let perm = await prisma.permission.findUnique({ where: { name: pk } });
        if (!perm) perm = await prisma.permission.create({ data: { name: pk, description: pk } });
        await prisma.userPermission.upsert({
          where: { userId_permissionId: { userId: user.id, permissionId: perm.id } },
          update: {},
          create: { userId: user.id, permissionId: perm.id }
        });
      }
    }
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: { userId: actingUser.id, action: 'CREATE', entity: 'User', details: JSON.stringify({ username, fullName }) }
    });
    return res.json({ success: true, id: user.id });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });
    return res.status(400).json({ error: 'فشل إنشاء المستخدم' });
  }
});

// ==================== UPDATE USER ====================
router.put('/users/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const { password, fullName, role, maxDevicesAllowed, permissions, status } = req.body;
  try {
    const dataToUpdate: any = {};
    if (fullName) dataToUpdate.fullName = fullName;
    if (role) dataToUpdate.role = role;
    if (maxDevicesAllowed) dataToUpdate.maxDevicesAllowed = parseInt(maxDevicesAllowed);
    if (status) dataToUpdate.status = status;
    if (password && password.trim()) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: dataToUpdate });

    if (permissions && Array.isArray(permissions)) {
      await prisma.userPermission.deleteMany({ where: { userId: user.id } });
      for (const pk of permissions) {
        let perm = await prisma.permission.findUnique({ where: { name: pk } });
        if (!perm) perm = await prisma.permission.create({ data: { name: pk, description: pk } });
        await prisma.userPermission.create({ data: { userId: user.id, permissionId: perm.id } });
      }
    }
    const actingUser = (req as any).user;
    await prisma.auditLog.create({
      data: { userId: actingUser.id, action: 'UPDATE', entity: 'User', details: JSON.stringify({ targetId: req.params.id }) }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: 'فشل تحديث المستخدم' });
  }
});

// ==================== DELETE USER ====================
router.delete('/users/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    const actingUser = (req as any).user;
    if (req.params.id === actingUser.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل حذف المستخدم' });
  }
});

// ==================== REVOKE SESSION ====================
router.delete('/users/:id/sessions', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    await prisma.loginSession.updateMany({ where: { userId: req.params.id, status: 'ACTIVE' }, data: { status: 'REVOKED' } });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل إلغاء الجلسات' });
  }
});

// ==================== GET ALL PERMISSIONS ====================
router.get('/permissions', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const perms = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
  return res.json(perms);
});

export default router;
