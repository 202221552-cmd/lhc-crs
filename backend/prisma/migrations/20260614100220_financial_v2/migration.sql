-- AlterTable
ALTER TABLE "EducationalEntity" ADD COLUMN     "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN     "entityClaimId" INTEGER,
ADD COLUMN     "lecturerCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "courseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'PER_COURSE';

-- CreateTable
CREATE TABLE "EntityClaim" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "subscriptionType" TEXT,
    "totalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entityShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "centerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidInstallments" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "periodMonth" INTEGER,
    "periodYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturerPayment" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LecturerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LecturerPayment_instructorId_sectionId_key" ON "LecturerPayment"("instructorId", "sectionId");

-- AddForeignKey
ALTER TABLE "EntityClaim" ADD CONSTRAINT "EntityClaim_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "EducationalEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityClaim" ADD CONSTRAINT "EntityClaim_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturerPayment" ADD CONSTRAINT "LecturerPayment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturerPayment" ADD CONSTRAINT "LecturerPayment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturerPayment" ADD CONSTRAINT "LecturerPayment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
