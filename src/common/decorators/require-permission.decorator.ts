import { SetMetadata } from '@nestjs/common';
import { EmployeePermissionType } from '../../generated/prisma/enums.js';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (
    permission: EmployeePermissionType,
) => SetMetadata(REQUIRED_PERMISSION_KEY, permission);