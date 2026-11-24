import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateDataEntryDto } from './dto/create-data-entry.dto.js';
import { QueryDataEntriesDto } from './dto/query-data-entries.dto.js';

import {
    DataEntryStatus,
    UserRole,
    UserStatus,
} from '../generated/prisma/enums.js';

import { Prisma } from '../generated/prisma/client.js';

import { DocumentsService } from '../documents/documents.service.js';


interface CurrentUser {
    id: string;
    role: UserRole;
    organizationId: string | null;
    departmentId?: string | null;
}

@Injectable()
export class DataEntriesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService
    ) {}

    private resolvePeriod(
        frequency: string,
        periodKey: string,
    ) {
        let start: Date;
        let end: Date;

        if (frequency === 'MONTHLY') {
        if (!/^\d{4}-\d{2}$/.test(periodKey)) {
            throw new BadRequestException(
            'Monthly KPI requires periodKey in YYYY-MM format',
            );
        }

        const [year, month] = periodKey.split('-').map(Number);

        if (month < 1 || month > 12) {
            throw new BadRequestException('Invalid month');
        }

        start = new Date(Date.UTC(year, month - 1, 1));
        end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        } else if (frequency === 'QUARTERLY') {
        const match = periodKey.match(/^(\d{4})-Q([1-4])$/);

        if (!match) {
            throw new BadRequestException(
            'Quarterly KPI requires periodKey in YYYY-Q1 format',
            );
        }

        const year = Number(match[1]);
        const quarter = Number(match[2]);
        const startMonth = (quarter - 1) * 3;

        start = new Date(Date.UTC(year, startMonth, 1));
        end = new Date(
            Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999),
        );
        } else if (frequency === 'ANNUAL') {
        if (!/^\d{4}$/.test(periodKey)) {
            throw new BadRequestException(
            'Annual KPI requires periodKey in YYYY format',
            );
        }

        const year = Number(periodKey);

        start = new Date(Date.UTC(year, 0, 1));
        end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        } else {
        throw new BadRequestException('Unsupported KPI frequency');
        }

        return { start, end };
    }

    private ensureOrganization(user: CurrentUser): string {
        if (!user.organizationId) {
        throw new ForbiddenException(
            'User is not associated with an organization',
        );
        }

        return user.organizationId;
    }


    private async ensureDepartmentAccess(
        user: CurrentUser,
        departmentId: string,
        organizationId: string,
        ) {
        if (user.role === UserRole.ORG_ADMIN) {
            return;
        }

        if (user.role !== UserRole.ORG_MEMBER) {
            throw new ForbiddenException('This role cannot access department data');
        }

        const employee = await this.prisma.user.findFirst({
            where: {
            id: user.id,
            organizationId,
            role: UserRole.ORG_MEMBER,
            status: UserStatus.ACTIVE,
            deletedAt: null,
            },
            select: {
            departmentId: true,
            },
        });

        if (!employee || employee.departmentId !== departmentId) {
            throw new ForbiddenException(
            'You cannot access data from another department',
            );
        }
    }


    async create(
        user: CurrentUser,
        dto: CreateDataEntryDto,
    ) {
        const organizationId = this.ensureOrganization(user);

        const dataItem = await this.prisma.dataItem.findFirst({
        where: {
            id: dto.dataItemId,
            organizationId,
            isActive: true,
            department: {
            isActive: true,
            organizationId,
            },
        },
        select: {
            id: true,
            name: true,
            frequency: true,
            unit: true,
            departmentId: true,
        },
        });

        if (!dataItem) {
        throw new NotFoundException('KPI Data Item not found');
        }

        await this.ensureDepartmentAccess(
            user,
            dataItem.departmentId,
            organizationId,
        );

        const { start, end } = this.resolvePeriod(
        dataItem.frequency,
        dto.periodKey,
        );

        const collectorId = dto.dataCollectorId ?? user.id;

        if (
            user.role === UserRole.ORG_MEMBER &&
            dto.dataCollectorId &&
            dto.dataCollectorId !== user.id
        ) {
            throw new ForbiddenException(
                'Employees can only record themselves as the data collector',
            );
        }

        const collector = await this.prisma.user.findFirst({
        where: {
            id: collectorId,
            organizationId,
            status: UserStatus.ACTIVE,
            deletedAt: null,
            departmentId: dataItem.departmentId,
            role: UserRole.ORG_MEMBER,
        },
        select: { id: true },
        });

        if (dto.dataCollectorId && !collector) {
            throw new BadRequestException(
                'Data collector must be an active employee in the KPI department',
            );
        }

        if (
        user.role === UserRole.ORG_MEMBER &&
        !collector
        ) {
            throw new ForbiddenException(
                'You cannot record data without being an active employee in this department',
            );
        }

        if (!dto.dataCollectorId && user.role === UserRole.ORG_MEMBER && !collector) {
        throw new ForbiddenException(
            'You cannot assign yourself as the data collector',
        );
        }

        try {
        const entry = await this.prisma.dataEntry.create({
            data: {
            organizationId,
            departmentId: dataItem.departmentId,
            dataItemId: dataItem.id,
            periodKey: dto.periodKey,
            periodStart: start,
            periodEnd: end,
            value: new Prisma.Decimal(dto.value),
            notes: dto.notes?.trim() || null,
            enteredById: user.id,
            dataCollectorId: collectorId,
            status: DataEntryStatus.DRAFT,
            },
            include: {
            dataItem: {
                select: {
                id: true,
                code: true,
                name: true,
                category: true,
                unit: true,
                frequency: true,
                },
            },
            department: {
                select: { id: true, name: true },
            },
            enteredBy: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
            dataCollector: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
            },
        });

        return {
            message: 'ESG data entry created successfully',
            data: entry,
        };
        } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            throw new ConflictException(
            'A data entry already exists for this KPI and reporting period',
            );
        }

        throw error;
        }
    }

    async findAll(
        user: CurrentUser,
        query: QueryDataEntriesDto,
    ) {
        const organizationId = this.ensureOrganization(user);

        if (
        user.role === UserRole.ORG_MEMBER &&
        query.departmentId &&
        query.departmentId !== user.departmentId
        ) {
        throw new ForbiddenException(
            'You cannot access another department',
        );
        }

        let employeeDepartmentId: string | undefined;

        if (user.role === UserRole.ORG_MEMBER) {
            const employee = await this.prisma.user.findFirst({
                where: {
                id: user.id,
                organizationId,
                role: UserRole.ORG_MEMBER,
                status: UserStatus.ACTIVE,
                deletedAt: null,
                },
                select: {
                departmentId: true,
                },
            });

            if (!employee?.departmentId) {
                throw new ForbiddenException(
                'Employee is not assigned to a department',
                );
            }

            employeeDepartmentId = employee.departmentId;

            if (
                query.departmentId &&
                query.departmentId !== employeeDepartmentId
            ) {
                throw new ForbiddenException(
                'You cannot access another department',
                );
            }
        }

        const where: Prisma.DataEntryWhereInput = {
            organizationId,

            ...(query.departmentId && {
                departmentId: query.departmentId,
            }),

            ...(employeeDepartmentId && {
                departmentId: employeeDepartmentId,
            }),

            ...(query.dataItemId && {
                dataItemId: query.dataItemId,
            }),

            ...(query.periodKey && {
                periodKey: query.periodKey,
            }),

            ...(query.status && {
                status: query.status as DataEntryStatus,
            }),
        };

        const entries = await this.prisma.dataEntry.findMany({
        where,
        orderBy: [
            { periodStart: 'desc' },
            { createdAt: 'desc' },
        ],
        include: {
            dataItem: {
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                unit: true,
                frequency: true,
            },
            },
            department: {
            select: { id: true, name: true },
            },
            enteredBy: {
            select: { id: true, firstName: true, lastName: true },
            },
            dataCollector: {
            select: { id: true, firstName: true, lastName: true },
            },
            _count: {
            select: { supportingDocuments: true },
            },
        },
        });

        return {
        data: entries,
        meta: {
            total: entries.length,
        },
        };
    }

    async findOne(
        user: CurrentUser,
        entryId: string,
    ) {
        const organizationId = this.ensureOrganization(user);

        const entry = await this.prisma.dataEntry.findFirst({
        where: {
            id: entryId,
            organizationId,
        },
        include: {
            dataItem: true,
            department: {
            select: { id: true, name: true },
            },
            enteredBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
            },
            dataCollector: {
            select: { id: true, firstName: true, lastName: true, email: true },
            },
            supportingDocuments: {
            select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
                scanStatus: true,
                uploadedById: true,
                createdAt: true,
            },
            },
        },
        });

        if (!entry) {
        throw new NotFoundException('Data entry not found');
        }

        await this.ensureDepartmentAccess(
            user,
            entry.departmentId,
            organizationId,
        );

        return { data: entry };
    }

    async uploadDocument(
        user: CurrentUser,
        entryId: string,
        file: Express.Multer.File,
    ) {
        const organizationId = this.ensureOrganization(user);

        const entry = await this.prisma.dataEntry.findFirst({
        where: {
            id: entryId,
            organizationId,
        },
        select: {
            id: true,
            departmentId: true,
        },
        });

        if (!entry) {
        throw new NotFoundException('Data entry not found');
        }

        await this.ensureDepartmentAccess(
            user,
            entry.departmentId,
            organizationId,
        );

        if (!file) {
        throw new BadRequestException('Evidence file is required');
        }

        const uploaded = await this.documentsService.uploadEvidenceDocument(file);

        try {
        const document = await this.prisma.supportingDocument.create({
            data: {
            organizationId,
            dataEntryId: entry.id,
            uploadedById: user.id,
            originalFileName: uploaded.originalFileName,
            mimeType: uploaded.mimeType,
            sizeBytes: uploaded.sizeBytes,
            cloudinaryPublicId: uploaded.cloudinaryPublicId,
            secureUrl: uploaded.secureUrl,
            sha256: uploaded.sha256,
            scanStatus: uploaded.scanStatus,
            },
            select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
            scanStatus: true,
            createdAt: true,
            },
        });

        return {
            message: 'Supporting document uploaded successfully',
            data: document,
        };
        } catch (error) {
        await this.documentsService.deleteEvidenceDocument(
            uploaded.cloudinaryPublicId,
        );

        throw error;
        }
    }

    async findDocuments(
        user: CurrentUser,
        entryId: string,
    ) {
        const organizationId = this.ensureOrganization(user);

        const entry = await this.prisma.dataEntry.findFirst({
        where: {
            id: entryId,
            organizationId,
        },
        select: {
            id: true,
            departmentId: true,
        },
        });

        if (!entry) {
        throw new NotFoundException('Data entry not found');
        }
        await this.ensureDepartmentAccess(
            user,
            entry.departmentId,
            organizationId,
        );
        const documents = await this.prisma.supportingDocument.findMany({
        where: {
            organizationId,
            dataEntryId: entryId,
            scanStatus: 'CLEAN',
        },
        select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedBy: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
            },
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        });

        return { data: documents };
    }

    async getDocumentAccess(
        user: CurrentUser,
        documentId: string,
        mode: 'view' | 'download',
    ) {
        const organizationId = this.ensureOrganization(user);

        const document = await this.prisma.supportingDocument.findFirst({
        where: {
            id: documentId,
            organizationId,
            scanStatus: 'CLEAN',
            dataEntry: {
            organizationId,
            },
        },
        include: {
            dataEntry: {
            select: {
                departmentId: true,
            },
            },
        },
        });

        if (!document) {
        throw new NotFoundException('Supporting document not found');
        }

        await this.ensureDepartmentAccess(
            user,
            document.dataEntry.departmentId,
            organizationId,
        );

        return this.documentsService.generateEvidenceDocumentUrl(
        document.cloudinaryPublicId,
        document.originalFileName,
        mode,
        );
    }
}
