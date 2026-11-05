-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubIndustry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "industryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubIndustry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "hqCountry" TEXT NOT NULL,
    "firstReportingYear" INTEGER NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "subIndustryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- CreateIndex
CREATE INDEX "Sector_isActive_sortOrder_idx" ON "Sector"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Industry_sectorId_isActive_sortOrder_idx" ON "Industry"("sectorId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_sectorId_name_key" ON "Industry"("sectorId", "name");

-- CreateIndex
CREATE INDEX "SubIndustry_industryId_isActive_sortOrder_idx" ON "SubIndustry"("industryId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SubIndustry_industryId_name_key" ON "SubIndustry"("industryId", "name");

-- CreateIndex
CREATE INDEX "Organization_subIndustryId_idx" ON "Organization"("subIndustryId");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubIndustry" ADD CONSTRAINT "SubIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_subIndustryId_fkey" FOREIGN KEY ("subIndustryId") REFERENCES "SubIndustry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
