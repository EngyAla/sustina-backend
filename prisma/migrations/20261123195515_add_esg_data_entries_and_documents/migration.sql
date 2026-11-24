-- CreateEnum
CREATE TYPE "DataEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "SupportingDocumentType" AS ENUM ('EVIDENCE', 'OTHER');

-- CreateTable
CREATE TABLE "DataEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "dataItemId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "notes" TEXT,
    "status" "DataEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "enteredById" TEXT NOT NULL,
    "dataCollectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportingDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dataEntryId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "documentType" "SupportingDocumentType" NOT NULL DEFAULT 'EVIDENCE',
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'CLEAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataEntry_organizationId_departmentId_periodStart_idx" ON "DataEntry"("organizationId", "departmentId", "periodStart");

-- CreateIndex
CREATE INDEX "DataEntry_organizationId_status_idx" ON "DataEntry"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DataEntry_dataItemId_periodKey_idx" ON "DataEntry"("dataItemId", "periodKey");

-- CreateIndex
CREATE INDEX "DataEntry_enteredById_idx" ON "DataEntry"("enteredById");

-- CreateIndex
CREATE INDEX "DataEntry_dataCollectorId_idx" ON "DataEntry"("dataCollectorId");

-- CreateIndex
CREATE UNIQUE INDEX "DataEntry_organizationId_dataItemId_periodKey_key" ON "DataEntry"("organizationId", "dataItemId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "SupportingDocument_cloudinaryPublicId_key" ON "SupportingDocument"("cloudinaryPublicId");

-- CreateIndex
CREATE INDEX "SupportingDocument_organizationId_dataEntryId_idx" ON "SupportingDocument"("organizationId", "dataEntryId");

-- CreateIndex
CREATE INDEX "SupportingDocument_uploadedById_idx" ON "SupportingDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "SupportingDocument_sha256_idx" ON "SupportingDocument"("sha256");

-- CreateIndex
CREATE INDEX "SupportingDocument_scanStatus_idx" ON "SupportingDocument"("scanStatus");

-- AddForeignKey
ALTER TABLE "DataEntry" ADD CONSTRAINT "DataEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntry" ADD CONSTRAINT "DataEntry_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntry" ADD CONSTRAINT "DataEntry_dataItemId_fkey" FOREIGN KEY ("dataItemId") REFERENCES "DataItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntry" ADD CONSTRAINT "DataEntry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntry" ADD CONSTRAINT "DataEntry_dataCollectorId_fkey" FOREIGN KEY ("dataCollectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_dataEntryId_fkey" FOREIGN KEY ("dataEntryId") REFERENCES "DataEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
