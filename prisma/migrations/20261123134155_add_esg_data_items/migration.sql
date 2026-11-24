-- CreateEnum
CREATE TYPE "ESGCategory" AS ENUM ('ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "DataFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "DataItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ESGCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "DataFrequency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataItem_organizationId_departmentId_isActive_idx" ON "DataItem"("organizationId", "departmentId", "isActive");

-- CreateIndex
CREATE INDEX "DataItem_organizationId_category_isActive_idx" ON "DataItem"("organizationId", "category", "isActive");

-- CreateIndex
CREATE INDEX "DataItem_organizationId_frequency_isActive_idx" ON "DataItem"("organizationId", "frequency", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DataItem_organizationId_code_key" ON "DataItem"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "DataItem" ADD CONSTRAINT "DataItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataItem" ADD CONSTRAINT "DataItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
