import {
    Controller,
    Get,
    Param,
    Query,
    Req,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';

import { DataManagementService } from './data-management.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { RequirePermission } from '../common/decorators/require-permission.decorator.js';

import { EmployeePermissionType } from '../generated/prisma/enums.js';

interface AuthenticatedRequest {
    user: {
        id: string;
        email: string;
        role: any;
        organizationId: string | null;
        departmentId?: string | null;
    };
}

@Controller('data-management')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataManagementController {
    constructor(
        private readonly dataManagementService: DataManagementService,
    ) {}

    // GET /api/data-management/overview?year=2026
    @Get('overview')
    @RequirePermission(EmployeePermissionType.VIEW)
    getOverview(
        @Req() req: AuthenticatedRequest,
        @Query('year') year?: string,
    ) {
        return this.dataManagementService.getOverview(
            req.user,
            year,
        );
    }

    // GET /api/data-management/departments/:departmentId?year=2026
    @Get('departments/:departmentId')
    @RequirePermission(EmployeePermissionType.VIEW)
    getDepartmentDetails(
        @Req() req: AuthenticatedRequest,
        @Param('departmentId', ParseUUIDPipe)
        departmentId: string,
        @Query('year') year?: string,
    ) {
        return this.dataManagementService.getDepartmentDetails(
            req.user,
            departmentId,
            year,
        );
    }

    // GET /api/data-management/departments/:departmentId/items
    @Get('departments/:departmentId/items')
    @RequirePermission(EmployeePermissionType.VIEW)
    getDepartmentItems(
        @Req() req: AuthenticatedRequest,
        @Param('departmentId', ParseUUIDPipe)
        departmentId: string,
        @Query() filters: {
            year?: string;
            search?: string;
            category?: string;
            frequency?: string;
            status?: string;
            page?: string;
            limit?: string;
        },
    ) {
        return this.dataManagementService.getDepartmentItems(
            req.user,
            departmentId,
            filters,
        );
    }
}
