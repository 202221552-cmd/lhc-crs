-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxDevicesAllowed" INTEGER NOT NULL DEFAULT 3,
    "supervisorId" INTEGER,
    "employeeId" INTEGER,
    "instructorId" INTEGER,
    "studentId" TEXT,
    "portalBg" TEXT,
    "portalBgType" TEXT DEFAULT 'NONE',
    "portals" TEXT NOT NULL DEFAULT '[]',
    "portalTabs" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalEntity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "uniPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roomAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "costType" TEXT NOT NULL DEFAULT 'FIXED',
    "building" TEXT,
    "floor" TEXT,
    "hasProjector" BOOLEAN NOT NULL DEFAULT false,
    "hasAC" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "entityId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diploma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalHours" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diploma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiplomaCourse" (
    "id" SERIAL NOT NULL,
    "diplomaId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiplomaCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "id" SERIAL NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "courseId" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "days" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "fullNameEn" TEXT,
    "dob" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'JO',
    "nationalityName" TEXT,
    "nationalId" TEXT,
    "passportId" TEXT,
    "personalId" TEXT,
    "phones" TEXT NOT NULL DEFAULT '[]',
    "phoneCodes" TEXT NOT NULL DEFAULT '["+962"]',
    "whatsappOnly" TEXT NOT NULL DEFAULT '[]',
    "isIdNumber" TEXT NOT NULL DEFAULT '[]',
    "address" TEXT,
    "studentType" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "universityName" TEXT,
    "universityId" TEXT,
    "highSchoolPassed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "marketerName" TEXT,
    "markerEmployeeId" INTEGER,
    "notes" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiplomaSubscription" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "diplomaId" TEXT NOT NULL,
    "entityId" INTEGER,
    "studyType" TEXT NOT NULL DEFAULT 'FACE_TO_FACE',
    "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasTransport" BOOLEAN NOT NULL DEFAULT false,
    "transportFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasSupplies" BOOLEAN NOT NULL DEFAULT false,
    "suppliesFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'NONE',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'FULL',
    "installmentsCount" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiplomaSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSubscription" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "entityId" INTEGER,
    "studyType" TEXT NOT NULL DEFAULT 'FACE_TO_FACE',
    "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasTransport" BOOLEAN NOT NULL DEFAULT false,
    "transportFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasSupplies" BOOLEAN NOT NULL DEFAULT false,
    "suppliesFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'NONE',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'FULL',
    "installmentsCount" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedCourse" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestedCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSection" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "enrollDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "midtermGrade" DOUBLE PRECISION,
    "participationGrade" DOUBLE PRECISION,
    "finalGrade" DOUBLE PRECISION,
    "totalGrade" DOUBLE PRECISION,
    "result" TEXT,
    "supervisorApproved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "subscriptionType" TEXT,
    "installmentId" INTEGER,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "receiptNumber" INTEGER NOT NULL DEFAULT 0,
    "referenceNumber" TEXT,
    "universityShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "centerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "subscriptionType" TEXT NOT NULL,
    "diplomaSubId" INTEGER,
    "courseSubId" INTEGER,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "isDeferred" BOOLEAN NOT NULL DEFAULT false,
    "deferredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionType" TEXT NOT NULL DEFAULT 'NONE',
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "supervisorId" INTEGER,
    "assignedEntityIds" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salary" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonuses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "studentId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionType" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacation" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitySettlement" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntitySettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementPayment" (
    "id" SERIAL NOT NULL,
    "settlementId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'BANK',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "columns" TEXT NOT NULL,
    "filters" TEXT,
    "sortBy" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSequence" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalBackground" (
    "id" SERIAL NOT NULL,
    "portal" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GRADIENT',
    "content" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalBackground_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginSession_token_key" ON "LoginSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaCourse_diplomaId_courseId_key" ON "DiplomaCourse"("diplomaId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrerequisite_courseId_prerequisiteId_key" ON "CoursePrerequisite"("courseId", "prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestedCourse_studentId_courseId_key" ON "RequestedCourse"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSection_studentId_sectionId_key" ON "StudentSection"("studentId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sectionId_studentId_date_key" ON "Attendance"("sectionId", "studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Salary_employeeId_month_year_key" ON "Salary"("employeeId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EntitySettlement_entityId_month_year_key" ON "EntitySettlement"("entityId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSequence_key_key" ON "SystemSequence"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PortalBackground_portal_key" ON "PortalBackground"("portal");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginSession" ADD CONSTRAINT "LoginSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "EducationalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiplomaCourse" ADD CONSTRAINT "DiplomaCourse_diplomaId_fkey" FOREIGN KEY ("diplomaId") REFERENCES "Diploma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiplomaCourse" ADD CONSTRAINT "DiplomaCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_markerEmployeeId_fkey" FOREIGN KEY ("markerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiplomaSubscription" ADD CONSTRAINT "DiplomaSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiplomaSubscription" ADD CONSTRAINT "DiplomaSubscription_diplomaId_fkey" FOREIGN KEY ("diplomaId") REFERENCES "Diploma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiplomaSubscription" ADD CONSTRAINT "DiplomaSubscription_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "EducationalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubscription" ADD CONSTRAINT "CourseSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubscription" ADD CONSTRAINT "CourseSubscription_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubscription" ADD CONSTRAINT "CourseSubscription_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "EducationalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedCourse" ADD CONSTRAINT "RequestedCourse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedCourse" ADD CONSTRAINT "RequestedCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_diplomaSubId_fkey" FOREIGN KEY ("diplomaSubId") REFERENCES "DiplomaSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_courseSubId_fkey" FOREIGN KEY ("courseSubId") REFERENCES "CourseSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacation" ADD CONSTRAINT "Vacation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitySettlement" ADD CONSTRAINT "EntitySettlement_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "EducationalEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "EntitySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
