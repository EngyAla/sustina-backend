-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionOperation" (
    "id" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "operation" "EmployeePermissionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePermissionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePermissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Permission_organizationId_isActive_idx" ON "Permission"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Permission_organizationId_createdAt_idx" ON "Permission"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_organizationId_name_key" ON "Permission"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PermissionOperation_permissionId_idx" ON "PermissionOperation"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionOperation_permissionId_operation_key" ON "PermissionOperation"("permissionId", "operation");

-- CreateIndex
CREATE INDEX "EmployeePermissionAssignment_userId_idx" ON "EmployeePermissionAssignment"("userId");

-- CreateIndex
CREATE INDEX "EmployeePermissionAssignment_permissionId_idx" ON "EmployeePermissionAssignment"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePermissionAssignment_userId_permissionId_key" ON "EmployeePermissionAssignment"("userId", "permissionId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionOperation" ADD CONSTRAINT "PermissionOperation_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePermissionAssignment" ADD CONSTRAINT "EmployeePermissionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePermissionAssignment" ADD CONSTRAINT "EmployeePermissionAssignment_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
