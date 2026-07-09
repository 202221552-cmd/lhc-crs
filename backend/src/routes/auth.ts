import express from 'express';
import { prisma } from '../index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ems-super-secret-2026';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROFILES_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'profiles');
if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PROFILES_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مدعوم'));
  },
});

const getDefaultPortals = (role: string): string[] => {
  if (role === 'STUDENT') return ['STUDENT'];
  if (role === 'INSTRUCTOR') return ['INSTRUCTOR'];
  if (role === 'REGISTRAR' || role === 'EMPLOYEE') return ['EMPLOYEE'];
  if (role === 'TEAM_LEADER') return ['ADMIN', 'EMPLOYEE'];
  return ['ADMIN']; // ADMIN, SUPERVISOR, TRAINEE default to ADMIN portal
};

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  const { username, password, portal } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      include: { permissions: { include: { permission: true } } }
    });

    if (!user) {
      await prisma.failedLoginAttempt.create({
        data: { username: username.toLowerCase().trim(), ipAddress, userAgent: (req.headers['user-agent'] || '').substring(0, 255) }
      });
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const ua = (req.headers['user-agent'] || '').substring(0, 255);

      await prisma.failedLoginAttempt.create({
        data: { username, ipAddress, userAgent: ua }
      });

      // Check for 3+ failed attempts in the last 15 minutes
      const recent = await prisma.failedLoginAttempt.count({
        where: {
          username,
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
        }
      });

      if (recent >= 3) {
        await prisma.securityAlert.create({
          data: {
            userId: user.id,
            type: 'FAILED_LOGIN_ATTEMPT',
            message: `تمت محاولة تسجيل دخول فاشلة ${recent} مرات لحسابك من جهاز غير معروف`,
            ipAddress,
            deviceType: ua,
            userAgent: ua
          }
        });
      }

      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Clear failed attempts on successful login
    await prisma.failedLoginAttempt.deleteMany({ where: { username } });

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'هذا الحساب معطّل. يرجى التواصل مع المسؤول.' });
    }

    // Portal access check — reject if user doesn't have this portal
    if (portal) {
      let userPortals: string[] = [];
      try { userPortals = JSON.parse(user.portals || '[]'); } catch {}
      if (!userPortals.map(p => p.toUpperCase()).includes(portal.toUpperCase())) {
        const portalNames: Record<string, string> = {
          ADMIN: 'بوابة الإدارة', EMPLOYEE: 'بوابة الموظفين',
          INSTRUCTOR: 'بوابة المحاضرين', STUDENT: 'بوابة الطلاب',
        };
        const allowed = userPortals.map(p => portalNames[p] || p).join('، ') || 'بدون';
        return res.status(403).json({ error: `لا يمكنك الدخول من ${portalNames[portal] || portal}. البوابات المصرح بها: ${allowed}` });
      }
    }

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

    let portals: string[] = [];
    let portalTabs: string[] = [];
    try { portals = JSON.parse(user.portals || '[]'); } catch {}
    try { portalTabs = JSON.parse(user.portalTabs || '[]'); } catch {}

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isAdmin,
        permissions: isAdmin ? ['ADMIN_ALL'] : permKeys,
        status: user.status,
        portals,
        portalTabs,
        studentId: user.studentId,
        instructorId: user.instructorId,
        profileImage: user.profileImage || null,
        aboutStatus: user.aboutStatus || '',
        points: user.points,
        teamLeaderId: user.teamLeaderId,
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
  let portals: string[] = [];
  let portalTabs: string[] = [];
  try { portals = JSON.parse(user.portals || '[]'); } catch {}
  try { portalTabs = JSON.parse(user.portalTabs || '[]'); } catch {}
    return res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isAdmin,
    permissions: isAdmin ? ['ADMIN_ALL'] : permKeys,
    status: user.status,
    portals,
    portalTabs,
    studentId: user.studentId,
    employeeId: user.employeeId,
    instructorId: user.instructorId,
    supervisorId: user.supervisorId,
    teamLeaderId: user.teamLeaderId,
    points: user.points,
    preferences: user.preferences || '{}',
    profileImage: user.profileImage || null,
    aboutStatus: user.aboutStatus || '',
  });
});

// ==================== GET / PUT USER PREFERENCES ====================
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    return res.json({ preferences: user.preferences || '{}' });
  } catch { return res.status(500).json({ error: 'خطأ في جلب الإعدادات' }); }
});

router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { preferences } = req.body;
    if (!preferences) return res.status(400).json({ error: 'preferences مطلوب' });
    await prisma.user.update({
      where: { id: userId },
      data: { preferences: typeof preferences === 'string' ? preferences : JSON.stringify(preferences) }
    });
    return res.json({ success: true, preferences });
  } catch { return res.status(500).json({ error: 'خطأ في حفظ الإعدادات' }); }
});

// ==================== UPDATE PROFILE (self: image + status) ====================
router.put('/profile', authMiddleware, (req, res) => {
  profileUpload.single('profileImage')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'فشل رفع الصورة' });

    try {
      const userId = (req as any).user.id;
      const dataToUpdate: any = {};

      if (req.file) {
        dataToUpdate.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      if (req.body.aboutStatus !== undefined) {
        dataToUpdate.aboutStatus = req.body.aboutStatus;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      return res.json({
        success: true,
        profileImage: dataToUpdate.profileImage || null,
        aboutStatus: dataToUpdate.aboutStatus ?? '',
      });
    } catch (e) {
      return res.status(500).json({ error: 'فشل تحديث الملف الشخصي' });
    }
  });
});

// ==================== DELETE PROFILE IMAGE ====================
router.delete('/profile/image', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileImage: true } });
    if (user?.profileImage) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', user.profileImage.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.user.update({ where: { id: userId }, data: { profileImage: null } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'فشل حذف الصورة' });
  }
});

// ==================== GET ALL USERS (admin only) ====================
router.get('/users', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      permissions: { include: { permission: true } },
      loginSessions: { where: { status: 'ACTIVE' } },
      supervisor: { select: { id: true, fullName: true } },
      teamLeader: { select: { id: true, fullName: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  const safeUsers = users.map(u => {
    let portals: string[] = [];
    let portalTabs: string[] = [];
    let assignedEntityIds: number[] = [];
    try { portals = JSON.parse(u.portals || '[]'); } catch {}
    try { portalTabs = JSON.parse(u.portalTabs || '[]'); } catch {}
    try { assignedEntityIds = JSON.parse(u.assignedEntityIds || '[]'); } catch {}
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      maxDevicesAllowed: u.maxDevicesAllowed,
      activeSessionsCount: u.loginSessions.length,
      permissions: u.permissions.map(p => p.permission.name),
      createdAt: u.createdAt,
      portals,
      portalTabs,
      employeeId: u.employeeId,
      instructorId: u.instructorId,
      studentId: u.studentId,
      supervisorId: u.supervisorId,
      supervisorName: u.supervisor?.fullName || null,
      teamLeaderId: u.teamLeaderId,
      teamLeaderName: u.teamLeader?.fullName || null,
      points: u.points,
      assignedEntityIds
    };
  });
  return res.json(safeUsers);
});

// ==================== CREATE USER ====================
router.post('/users', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  let { username, password, fullName, role, maxDevicesAllowed, permissions, status, portals, portalTabs, employeeId, instructorId, studentId, supervisorId, teamLeaderId, assignedEntityIds } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'الحقول الإجبارية مفقودة' });
  }
  try {
    // Auto-link to student by systemId if studentId not provided
    if (!studentId && role === 'STUDENT') {
      const linkedStudent = await prisma.student.findUnique({ where: { id: username } });
      if (linkedStudent) studentId = linkedStudent.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createData: any = {
      username: username.toLowerCase().trim(),
      passwordHash,
      fullName,
      role: role || 'EMPLOYEE',
      status: status || 'ACTIVE',
      maxDevicesAllowed: maxDevicesAllowed || 3,
      portals: JSON.stringify(portals || getDefaultPortals(role)),
      portalTabs: JSON.stringify(portalTabs || []),
      employeeId: employeeId ? parseInt(employeeId) : null,
      instructorId: instructorId ? parseInt(instructorId) : null,
      assignedEntityIds: JSON.stringify(assignedEntityIds || []),
    };
    if (supervisorId || (role === 'EMPLOYEE' && supervisorId)) {
      createData.supervisorId = parseInt(supervisorId);
    }
    if (teamLeaderId) {
      createData.teamLeaderId = parseInt(teamLeaderId);
    }
    if (studentId && typeof studentId === 'string' && studentId.trim().length > 0) {
      createData.studentId = studentId.trim();
    }

    const user = await prisma.user.create({ data: createData });
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
  const { password, fullName, role, maxDevicesAllowed, permissions, status, portals, portalTabs, employeeId, instructorId, studentId, supervisorId, teamLeaderId, assignedEntityIds } = req.body;
  try {
    const dataToUpdate: any = {};
    if (fullName) dataToUpdate.fullName = fullName;
    if (role) dataToUpdate.role = role;
    if (maxDevicesAllowed) dataToUpdate.maxDevicesAllowed = parseInt(maxDevicesAllowed);
    if (status) dataToUpdate.status = status;
    if (portals) dataToUpdate.portals = JSON.stringify(portals);
    if (portalTabs) dataToUpdate.portalTabs = JSON.stringify(portalTabs);
    if (employeeId !== undefined) dataToUpdate.employeeId = employeeId ? parseInt(employeeId) : null;
    if (instructorId !== undefined) dataToUpdate.instructorId = instructorId ? parseInt(instructorId) : null;
    if (studentId !== undefined) dataToUpdate.studentId = studentId || null;
    if (supervisorId !== undefined) dataToUpdate.supervisorId = supervisorId ? parseInt(supervisorId) : null;
    if (teamLeaderId !== undefined) dataToUpdate.teamLeaderId = teamLeaderId ? parseInt(teamLeaderId) : null;
    if (assignedEntityIds !== undefined) dataToUpdate.assignedEntityIds = JSON.stringify(assignedEntityIds);
    if (password && password.trim()) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id as string) }, data: dataToUpdate });

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
      data: { userId: actingUser.id, action: 'UPDATE', entity: 'User', details: JSON.stringify({ targetId: (req.params.id as string) }) }
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
    if (parseInt(req.params.id as string) === actingUser.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    await prisma.user.delete({ where: { id: parseInt(req.params.id as string) } });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل حذف المستخدم' });
  }
});

// ==================== REVOKE SESSION ====================
router.delete('/users/:id/sessions', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  try {
    await prisma.loginSession.updateMany({ where: { userId: parseInt(req.params.id as string), status: 'ACTIVE' }, data: { status: 'REVOKED' } });
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'فشل إلغاء الجلسات' });
  }
});

// ==================== GET MY SESSIONS ====================
router.get('/sessions', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const sessions = await prisma.loginSession.findMany({
    where: { userId: user.id },
    orderBy: { lastActive: 'desc' }
  });
  return res.json(sessions.map(s => ({
    id: s.id,
    ipAddress: s.ipAddress,
    deviceType: s.deviceType,
    userAgent: s.userAgent || s.deviceType,
    status: s.status,
    lastActive: s.lastActive,
    createdAt: s.createdAt
  })));
});

// ==================== TERMINATE MY SESSION ====================
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const sessionId = parseInt(req.params.id as string);
  const session = await prisma.loginSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== user.id) {
    return res.status(404).json({ error: 'الجلسة غير موجودة' });
  }
  // Don't allow terminating own current session via this endpoint
  const token = req.headers.authorization?.split(' ')[1];
  if (session.token === token) {
    return res.status(400).json({ error: 'لا يمكن إنهاء جلستك الحالية من هنا. استخدم تسجيل الخروج.' });
  }
  await prisma.loginSession.update({ where: { id: sessionId }, data: { status: 'REVOKED' } });
  return res.json({ success: true });
});

// ==================== MY ACTIVITY ====================
router.get('/my-activity', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 50)
  });
  return res.json(auditLogs.map(a => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    details: a.details,
    createdAt: a.createdAt
  })));
});

// ==================== CHANGE PASSWORD ====================
router.put('/change-password', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const valid = await bcrypt.compare(currentPassword, dbUser!.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PASSWORD_CHANGE', entity: 'User', details: JSON.stringify({ username: user.username }) }
  });

  return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

// ==================== GET MY SECURITY ALERTS ====================
router.get('/security-alerts', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const alerts = await prisma.securityAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  return res.json(alerts);
});

// ==================== MARK ALERT AS READ ====================
router.put('/security-alerts/:id/read', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const alertId = parseInt(req.params.id as string);
  const alert = await prisma.securityAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.userId !== user.id) {
    return res.status(404).json({ error: 'الإشعار غير موجود' });
  }
  await prisma.securityAlert.update({ where: { id: alertId }, data: { read: true } });
  return res.json({ success: true });
});

// ==================== PERMISSION TEMPLATES ====================
router.get('/permission-templates', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const templates = await prisma.permissionTemplate.findMany({ orderBy: { name: 'asc' } });
  return res.json(templates.map(t => ({ ...t, permissions: JSON.parse(t.permissions) })));
});

router.post('/permission-templates', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const { name, permissions } = req.body;
  if (!name || !permissions) return res.status(400).json({ error: 'الاسم والصلاحيات مطلوبان' });
  const existing = await prisma.permissionTemplate.findUnique({ where: { name } });
  if (existing) return res.status(400).json({ error: 'يوجد قالب بنفس الاسم' });
  const t = await prisma.permissionTemplate.create({
    data: { name, permissions: JSON.stringify(permissions) }
  });
  return res.json({ ...t, permissions: JSON.parse(t.permissions) });
});

router.put('/permission-templates/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const { name, permissions } = req.body;
  const id = parseInt(req.params.id as string);
  const data: any = {};
  if (name) data.name = name;
  if (permissions) data.permissions = JSON.stringify(permissions);
  const t = await prisma.permissionTemplate.update({ where: { id }, data });
  return res.json({ ...t, permissions: JSON.parse(t.permissions) });
});

router.delete('/permission-templates/:id', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  await prisma.permissionTemplate.delete({ where: { id: parseInt(req.params.id as string) } });
  return res.json({ success: true });
});

// ==================== GET ALL PERMISSIONS ====================
router.get('/permissions', authMiddleware, requirePermission('admin.users'), async (req, res) => {
  const perms = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
  return res.json(perms);
});

export default router;
