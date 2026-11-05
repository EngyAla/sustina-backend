-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'ORG_MEMBER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RegistrationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ORG_MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "authorityAttestedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "registrationRequestId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRequest_referenceCode_key" ON "RegistrationRequest"("referenceCode");

-- CreateIndex
CREATE INDEX "RegistrationRequest_organizationId_idx" ON "RegistrationRequest"("organizationId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_submittedById_idx" ON "RegistrationRequest"("submittedById");

-- CreateIndex
CREATE INDEX "RegistrationRequest_reviewedById_idx" ON "RegistrationRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "RegistrationRequest_status_submittedAt_idx" ON "RegistrationRequest"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationDocument_cloudinaryPublicId_key" ON "OrganizationDocument"("cloudinaryPublicId");

-- CreateIndex
CREATE INDEX "OrganizationDocument_organizationId_idx" ON "OrganizationDocument"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationDocument_registrationRequestId_idx" ON "OrganizationDocument"("registrationRequestId");

-- CreateIndex
CREATE INDEX "OrganizationDocument_sha256_idx" ON "OrganizationDocument"("sha256");

-- CreateIndex
CREATE INDEX "OrganizationDocument_scanStatus_idx" ON "OrganizationDocument"("scanStatus");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationDocument" ADD CONSTRAINT "OrganizationDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationDocument" ADD CONSTRAINT "OrganizationDocument_registrationRequestId_fkey" FOREIGN KEY ("registrationRequestId") REFERENCES "RegistrationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
