import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { RegistrationsService } from './registrations.service.js';

import { RegistrationQueryDto } from '../dto/registration-query.dto.js';
import { RejectRegistrationDto } from '../dto/reject-registration.dto.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { DocumentAccessQueryDto } from '../dto/document-access-query.dto.js';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string | null;
    };
}

@Controller('admin/registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class RegistrationsController {
    constructor(
        private readonly registrationsService: RegistrationsService,
    ) {}

    // GET /api/admin/registrations
    @Get()
    findAll(
        @Query() query: RegistrationQueryDto,
    ) {
        return this.registrationsService.findAll(query);
    }

    // GET /api/admin/registrations/:referenceCode
    @Get(':referenceCode')
    findOne(
        @Param('referenceCode') referenceCode: string,
    ) {
        return this.registrationsService.findOne(referenceCode);
    }

    // PATCH /api/admin/registrations/:referenceCode/approve
    @Patch(':referenceCode/approve')
    approve(
        @Param('referenceCode') referenceCode: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.registrationsService.approve(
        referenceCode,
        request.user.id,
        );
    }

    // PATCH /api/admin/registrations/:referenceCode/reject
    @Patch(':referenceCode/reject')
    reject(
        @Param('referenceCode') referenceCode: string,
        @Req() request: AuthenticatedRequest,
        @Body() dto: RejectRegistrationDto,
    ) {
        return this.registrationsService.reject(
        referenceCode,
        request.user.id,
        dto,
        );
    }

    // GET /api/admin/registrations/:referenceCode/documents/:documentId/access
    @Get(':referenceCode/documents/:documentId/access')
    getDocumentAccess(
    @Param('referenceCode') referenceCode: string,
    @Param('documentId') documentId: string,
    @Query() query: DocumentAccessQueryDto,
    ) {
    return this.registrationsService.getDocumentAccess(
        referenceCode,
        documentId,
        query.mode,
    );
    }
}