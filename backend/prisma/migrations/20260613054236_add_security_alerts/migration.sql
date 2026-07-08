-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedLoginAttempt" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
