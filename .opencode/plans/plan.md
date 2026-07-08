# خطة التعديلات

## 1. تغيير مدة الإشعارات (Toast.tsx)
- الملف: `frontend/src/components/Toast.tsx`
- السطر 28: تغيير `20000` إلى `5000`

## 2. إضافة الحقول المفقودة لـ Room (Prisma schema)
- الملف: `backend/prisma/schema.prisma`
- إضافة للحقول `Room`: `building String?`, `floor String?`, `hasProjector Boolean @default(false)`, `hasAC Boolean @default(false)`, `notes String?`

## 3. تحديث راوت room.ts
- الملف: `backend/src/routes/room.ts`
- إضافة `floor`, `building`, `hasProjector`, `hasAC`, `notes` إلى POST و PUT

## 4. استبدال alert() بـ Toast في جميع الصفحات
- AdminEntitiesPage.tsx, AdminRoomsPage.tsx, AdminInstructorsPage.tsx, AdminUsersPage.tsx, FinReceiptsPage.tsx, SubscriptionPage.tsx, AddToSectionPage.tsx, FinInstallmentsPage.tsx, RequestCoursePage.tsx, ManageDiplomasPage.tsx, ManageCoursesPage.tsx, AdminActivityPage.tsx, AdminSystemPage.tsx, FinStudentPage.tsx

## 5. إنشاء migration
- تشغيل `npx prisma migrate dev` في backend/
