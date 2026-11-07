import {
    Controller,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

type AuthenticatedRequest = Request & {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
    };
};

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(
        private readonly organizationsService: OrganizationsService,
    ) {}

    @Get('me')
    getMyOrganization(@Req() request: AuthenticatedRequest) {
        return this.organizationsService.findMyOrganization(
        request.user.organizationId,
        );
    }
}