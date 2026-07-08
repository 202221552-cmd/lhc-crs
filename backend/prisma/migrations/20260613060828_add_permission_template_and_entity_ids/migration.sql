-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedEntityIds" TEXT NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "PermissionTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionTemplate_name_key" ON "PermissionTemplate"("name");
