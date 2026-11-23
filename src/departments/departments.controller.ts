import {
    Controller,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { DepartmentsService } from './departments.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { RequirePermission } from '../common/decorators/require-permission.decorator.js';

import {
    EmployeePermissionType,
} from '../generated/prisma/enums.js';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
    };
}

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
    constructor(
        private readonly departmentsService: DepartmentsService,
    ) {}

    @Get()
    @RequirePermission(EmployeePermissionType.VIEW)
    async findMyDepartments(
        @Req() req: AuthenticatedRequest,
    ) {
        return this.departmentsService.findMyDepartments(
        req.user.organizationId,
        );
    }
}