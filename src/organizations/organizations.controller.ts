import {
    Controller,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { RequirePermission } from '../common/decorators/require-permission.decorator.js';

import {
    EmployeePermissionType,
} from '../generated/prisma/enums.js';

type AuthenticatedRequest = Request & {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
    };
};

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
    constructor(
        private readonly organizationsService: OrganizationsService,
    ) {}

    @Get('me')
    @RequirePermission(EmployeePermissionType.VIEW)
    getMyOrganization(@Req() request: AuthenticatedRequest) {
        return this.organizationsService.findMyOrganization(
        request.user.organizationId,
        );
    }
}