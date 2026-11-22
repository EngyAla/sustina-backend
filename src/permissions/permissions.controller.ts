import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { PermissionsService } from './permissions.service.js';

import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { QueryPermissionsDto } from './dto/query-permissions.dto.js';
import { OrgAdminGuard } from '../employees/guards/org-admin.guard.js';


// Request type containing authenticated user
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
    };
}

@Controller('permissions')
@UseGuards(AuthGuard('jwt'), OrgAdminGuard)
export class PermissionsController {
    constructor(
        private readonly permissionsService: PermissionsService,
    ) {}

    // Create Permission
    @Post()
    create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreatePermissionDto,
    ) {
        return this.permissionsService.create(
        req.user.organizationId,
        dto,
        );
    }

    // Get all permissions
    @Get()
    findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query: QueryPermissionsDto,
    ) {
        return this.permissionsService.findAll(
        req.user.organizationId,
        query,
        );
    }

    // Get Permission details
    @Get(':id')
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.permissionsService.findOne(
        req.user.organizationId,
        id,
        );
    }

    // Update Permission
    @Patch(':id')
    update(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() dto: UpdatePermissionDto,
    ) {
        return this.permissionsService.update(
        req.user.organizationId,
        id,
        dto,
        );
    }

    // Activate Permission
    @Patch(':id/activate')
    activate(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.permissionsService.activate(
        req.user.organizationId,
        id,
        );
    }

    // Deactivate Permission
    @Patch(':id/deactivate')
    deactivate(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.permissionsService.deactivate(
        req.user.organizationId,
        id,
        );
    }

    // Delete Permission
    @Delete(':id')
    remove(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.permissionsService.remove(
        req.user.organizationId,
        id,
        );
    }
}