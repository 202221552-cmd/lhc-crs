import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ALL_PERMISSION_KEYS = [
  'students.view', 'students.add', 'students.edit', 'students.delete',
  'subscriptions.view', 'subscriptions.add', 'subscriptions.edit',
  'courses.manage', 'diplomas.manage', 'sections.manage', 'sections.assign',
  'attendance.manage', 'reports.academic',
  'finance.view', 'finance.receipts', 'finance.payments', 'finance.installments',
  'finance.reports', 'finance.settlements',
  'admin.users', 'admin.settings', 'admin.audit', 'admin.entities',
  'admin.rooms', 'admin.instructors',
  'ADMIN_ALL',
];

async function main() {
  console.log('🌱 Starting full seed...');

  // ==========================================
  // 1. Create ALL permissions
  // ==========================================
  const permMap: Record<string, string> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    const perm = await prisma.permission.upsert({
      where: { name: key },
      update: {},
      create: { name: key, description: key },
    });
    permMap[key] = perm.id;
  }
  console.log('✅ Permissions created');

  // ==========================================
  // 2. Create ADMIN user (username: admin, password: 102030.55)
  // ==========================================
  const adminPasswordHash = await bcrypt.hash('102030.55', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'مدير النظام (Owner)',
      role: 'ADMIN',
      status: 'ACTIVE',
      maxDevicesAllowed: 10,
    },
  });

  // Grant ADMIN_ALL permission
  await prisma.userPermission.upsert({
    where: { userId_permissionId: { userId: admin.id, permissionId: permMap['ADMIN_ALL'] } },
    update: {},
    create: { userId: admin.id, permissionId: permMap['ADMIN_ALL'] },
  });
  console.log('✅ Admin user created: admin / 102030.55');

  // ==========================================
  // 3. Demo employee users
  // ==========================================
  const registrarHash = await bcrypt.hash('123456', 10);
  const registrar = await prisma.user.upsert({
    where: { username: 'registrar' },
    update: {},
    create: {
      username: 'registrar',
      passwordHash: registrarHash,
      fullName: 'أحمد المسجّل',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      maxDevicesAllowed: 3,
    },
  });
  const registrarPerms = ['students.view','students.add','students.edit','subscriptions.view','subscriptions.add','sections.assign','attendance.manage','reports.academic'];
  for (const pk of registrarPerms) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: registrar.id, permissionId: permMap[pk] } },
      update: {},
      create: { userId: registrar.id, permissionId: permMap[pk] },
    });
  }

  const accountantHash = await bcrypt.hash('123456', 10);
  const accountant = await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {},
    create: {
      username: 'accountant',
      passwordHash: accountantHash,
      fullName: 'سارة المحاسبة',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      maxDevicesAllowed: 3,
    },
  });
  const accountantPerms = ['finance.view','finance.receipts','finance.payments','finance.installments','finance.reports','finance.settlements'];
  for (const pk of accountantPerms) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: accountant.id, permissionId: permMap[pk] } },
      update: {},
      create: { userId: accountant.id, permissionId: permMap[pk] },
    });
  }
  console.log('✅ Demo users created (registrar, accountant) — password: 123456');

  // ==========================================
  // 4. Educational Entities
  // ==========================================
  const jordan_uni = await prisma.educationalEntity.upsert({
    where: { id: 'ent-01' },
    update: {},
    create: {
      id: 'ent-01',
      name: 'الجامعة الأردنية',
      type: 'UNIVERSITY',
      status: 'ACTIVE',
      uniPercentage: 50,
      fixedAmount: 100,
      contactPhone: '065355000',
    },
  });

  const hashemite = await prisma.educationalEntity.upsert({
    where: { id: 'ent-02' },
    update: {},
    create: {
      id: 'ent-02',
      name: 'جامعة الهاشمية',
      type: 'UNIVERSITY',
      status: 'ACTIVE',
      uniPercentage: 45,
      fixedAmount: 80,
      contactPhone: '053826600',
    },
  });
  console.log('✅ Educational entities created');

  // ==========================================
  // 5. Rooms
  // ==========================================
  const room1 = await prisma.room.upsert({
    where: { id: 'room-01' },
    update: {},
    create: { id: 'room-01', name: 'قاعة 1', type: 'ROOM', capacity: 30 },
  });
  const room2 = await prisma.room.upsert({
    where: { id: 'room-02' },
    update: {},
    create: { id: 'room-02', name: 'مختبر الحاسوب', type: 'LAB', capacity: 25 },
  });
  const roomZoom = await prisma.room.upsert({
    where: { id: 'room-03' },
    update: {},
    create: { id: 'room-03', name: 'Zoom / Online', type: 'VIRTUAL', capacity: 100 },
  });
  console.log('✅ Rooms created');

  // ==========================================
  // 6. Instructors
  // ==========================================
  const inst1 = await prisma.instructor.upsert({
    where: { id: 'inst-01' },
    update: {},
    create: {
      id: 'inst-01',
      name: 'د. محمد الأحمد',
      specialization: 'علوم الحاسوب',
      phone: '0791234567',
      type: 'INTERNAL',
      status: 'ACTIVE',
    },
  });
  const inst2 = await prisma.instructor.upsert({
    where: { id: 'inst-02' },
    update: {},
    create: {
      id: 'inst-02',
      name: 'أ. سارة الخطيب',
      specialization: 'اللغة الإنجليزية',
      phone: '0795678901',
      type: 'EXTERNAL',
      status: 'ACTIVE',
    },
  });
  const inst3 = await prisma.instructor.upsert({
    where: { id: 'inst-03' },
    update: {},
    create: {
      id: 'inst-03',
      name: 'أ. خالد النمر',
      specialization: 'المحاسبة والمالية',
      phone: '0798765432',
      type: 'INTERNAL',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Instructors created');

  // ==========================================
  // 7. Courses
  // ==========================================
  const c1 = await prisma.course.upsert({
    where: { id: 'crs-01' },
    update: {},
    create: {
      id: 'crs-01',
      name: 'دورة ICDL الرخصة الدولية',
      category: 'COMPUTER',
      hours: 60,
      price: 150,
      duration: 'شهرين',
      status: 'ACTIVE',
    },
  });
  const c2 = await prisma.course.upsert({
    where: { id: 'crs-02' },
    update: {},
    create: {
      id: 'crs-02',
      name: 'برمجة الويب المتكاملة (HTML/CSS/JS)',
      category: 'COMPUTER',
      hours: 80,
      price: 200,
      duration: '3 أشهر',
      status: 'ACTIVE',
    },
  });
  const c3 = await prisma.course.upsert({
    where: { id: 'crs-03' },
    update: {},
    create: {
      id: 'crs-03',
      name: 'إدارة الموارد البشرية',
      category: 'MANAGEMENT',
      hours: 40,
      price: 150,
      duration: 'شهر ونصف',
      status: 'ACTIVE',
    },
  });
  const c4 = await prisma.course.upsert({
    where: { id: 'crs-04' },
    update: {},
    create: {
      id: 'crs-04',
      name: 'محادثة اللغة الإنجليزية - المستوى الأول',
      category: 'LANGUAGES',
      hours: 40,
      price: 100,
      duration: 'شهر ونصف',
      status: 'ACTIVE',
    },
  });
  const c5 = await prisma.course.upsert({
    where: { id: 'crs-05' },
    update: {},
    create: {
      id: 'crs-05',
      name: 'المحاسبة المالية لغير المحاسبين',
      category: 'FINANCE',
      hours: 36,
      price: 120,
      duration: 'شهر',
      status: 'ACTIVE',
    },
  });
  const c6 = await prisma.course.upsert({
    where: { id: 'crs-06' },
    update: {},
    create: {
      id: 'crs-06',
      name: 'تسويق رقمي عبر منصات التواصل',
      category: 'MANAGEMENT',
      hours: 45,
      price: 130,
      duration: 'شهر ونصف',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Courses created');

  // ==========================================
  // 8. Diplomas
  // ==========================================
  const d1 = await prisma.diploma.upsert({
    where: { id: 'dip-01' },
    update: {},
    create: {
      id: 'dip-01',
      name: 'دبلوم إدارة الأعمال والموارد البشرية',
      description: 'برنامج متكامل لتطوير المهارات الإدارية وإدارة الموارد البشرية',
      totalHours: 120,
      totalPrice: 700,
      category: 'MANAGEMENT',
      status: 'ACTIVE',
    },
  });
  const d2 = await prisma.diploma.upsert({
    where: { id: 'dip-02' },
    update: {},
    create: {
      id: 'dip-02',
      name: 'دبلوم التسويق الرقمي',
      description: 'تعلّم التسويق الرقمي من الصفر حتى الاحتراف',
      totalHours: 100,
      totalPrice: 500,
      category: 'MANAGEMENT',
      status: 'ACTIVE',
    },
  });
  const d3 = await prisma.diploma.upsert({
    where: { id: 'dip-03' },
    update: {},
    create: {
      id: 'dip-03',
      name: 'دبلوم تكنولوجيا المعلومات',
      description: 'دبلوم شامل في تقنية المعلومات والحوسبة',
      totalHours: 140,
      totalPrice: 600,
      category: 'COMPUTER',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Diplomas created');

  // ==========================================
  // 9. Link courses to diplomas
  // ==========================================
  await prisma.diplomaCourse.upsert({
    where: { diplomaId_courseId: { diplomaId: d1.id, courseId: c3.id } },
    update: {},
    create: { diplomaId: d1.id, courseId: c3.id, order: 1 },
  });
  await prisma.diplomaCourse.upsert({
    where: { diplomaId_courseId: { diplomaId: d1.id, courseId: c5.id } },
    update: {},
    create: { diplomaId: d1.id, courseId: c5.id, order: 2 },
  });
  await prisma.diplomaCourse.upsert({
    where: { diplomaId_courseId: { diplomaId: d2.id, courseId: c6.id } },
    update: {},
    create: { diplomaId: d2.id, courseId: c6.id, order: 1 },
  });
  await prisma.diplomaCourse.upsert({
    where: { diplomaId_courseId: { diplomaId: d3.id, courseId: c1.id } },
    update: {},
    create: { diplomaId: d3.id, courseId: c1.id, order: 1 },
  });
  await prisma.diplomaCourse.upsert({
    where: { diplomaId_courseId: { diplomaId: d3.id, courseId: c2.id } },
    update: {},
    create: { diplomaId: d3.id, courseId: c2.id, order: 2 },
  });

  // ==========================================
  // 10. Open Sections (schedule)
  // ==========================================
  await prisma.section.upsert({
    where: { id: 'sec-01' },
    update: {},
    create: {
      id: 'sec-01',
      name: 'ICDL - المجموعة الأولى',
      courseId: c1.id,
      roomId: room2.id,
      instructorId: inst1.id,
      days: '["SAT","MON","WED"]',
      startTime: '10:00',
      endTime: '12:00',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-01'),
      capacity: 25,
      status: 'OPEN',
    },
  });
  await prisma.section.upsert({
    where: { id: 'sec-02' },
    update: {},
    create: {
      id: 'sec-02',
      name: 'إنجليزي - المجموعة المسائية',
      courseId: c4.id,
      roomId: room1.id,
      instructorId: inst2.id,
      days: '["SUN","TUE","THU"]',
      startTime: '17:00',
      endTime: '19:00',
      startDate: new Date('2026-06-05'),
      endDate: new Date('2026-07-20'),
      capacity: 20,
      status: 'OPEN',
    },
  });
  console.log('✅ Sections created');

  console.log('\n🎉 Seed complete!\n');
  console.log('   Admin login: username=admin  password=102030.55');
  console.log('   Registrar:   username=registrar  password=123456');
  console.log('   Accountant:  username=accountant  password=123456\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
