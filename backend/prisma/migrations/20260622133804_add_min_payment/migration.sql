-- AlterTable: add minPayment and minPaymentException
ALTER TABLE "Course" ADD COLUMN "minPayment" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Diploma" ADD COLUMN "minPayment" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "DiplomaSubscription" ADD COLUMN "minPaymentException" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CourseSubscription" ADD COLUMN "minPaymentException" BOOLEAN NOT NULL DEFAULT false;
