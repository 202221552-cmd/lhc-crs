-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "supervisorEmployeeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_supervisorEmployeeId_fkey" FOREIGN KEY ("supervisorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
