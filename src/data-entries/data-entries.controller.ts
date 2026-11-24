import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    ParseUUIDPipe,
    BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { DataEntriesService } from './data-entries.service.js';

import { CreateDataEntryDto } from './dto/create-data-entry.dto.js';
import { QueryDataEntriesDto } from './dto/query-data-entries.dto.js';


import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';

import { EmployeePermissionType } from '../generated/prisma/enums.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest {
    user: {
        id: string;
        email: string;
        role: any;
        organizationId: string | null;
        departmentId?: string | null;
    };
}

@Controller('data-entries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataEntriesController {
    constructor(
        private readonly dataEntriesService: DataEntriesService,
    ) {}

    @Post()
    @RequirePermission(EmployeePermissionType.DATA_ENTRY)
    create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateDataEntryDto,
    ) {
        return this.dataEntriesService.create(req.user, dto);
    }

    @Get()
    @RequirePermission(EmployeePermissionType.VIEW)
    findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query: QueryDataEntriesDto,
    ) {
        return this.dataEntriesService.findAll(req.user, query);
    }

    @Get(':id')
    @RequirePermission(EmployeePermissionType.VIEW)
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.dataEntriesService.findOne(req.user, id);
    }

    @Post(':id/documents')
    @RequirePermission(EmployeePermissionType.FILE_UPLOAD)
    @UseInterceptors(
        FileInterceptor('file', {
        limits: {
            fileSize: 25 * 1024 * 1024,
        },
        }),
    )
    uploadDocument(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
        throw new BadRequestException('Evidence file is required');
        }

        return this.dataEntriesService.uploadDocument(
        req.user,
        id,
        file,
        );
    }

    @Get(':id/documents')
    @RequirePermission(EmployeePermissionType.VIEW)
    findDocuments(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.dataEntriesService.findDocuments(req.user, id);
    }

    @Get('documents/:documentId/access')
    @RequirePermission(EmployeePermissionType.VIEW)
    getDocumentAccess(
        @Req() req: AuthenticatedRequest,
        @Param('documentId', ParseUUIDPipe) documentId: string,
        @Query('mode') mode: 'view' | 'download' = 'view',
    ) {
        if (mode !== 'view' && mode !== 'download') {
        throw new BadRequestException(
            'mode must be either view or download',
        );
        }

        return this.dataEntriesService.getDocumentAccess(
        req.user,
        documentId,
        mode,
        );
    }
}
