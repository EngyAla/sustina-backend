import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import {
    DataEntryStatus,
    DataFrequency,
    ESGCategory,
    UserRole,
    UserStatus,
} from '../generated/prisma/enums.js';

interface CurrentUser {
    id: string;
    role: UserRole;
    organizationId: string | null;
    departmentId?: string | null;
}

type ItemCompletionStatus = 'COMPLETE' | 'IN_PROGRESS' | 'MISSING';

interface DataManagementFilters {
    year?: string;
    search?: string;
    category?: string;
    frequency?: string;
    status?: string;
    page?: string;
    limit?: string;
}

@Injectable()
export class DataManagementService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    // ==========================================
    // COMMON HELPERS
    // ==========================================

    private getOrganizationId(user: CurrentUser): string {
        if (!user.organizationId) {
            throw new ForbiddenException(
                'You are not associated with an organization',
            );
        }

        if (
            user.role !== UserRole.ORG_ADMIN &&
            user.role !== UserRole.ORG_MEMBER
        ) {
            throw new ForbiddenException(
                'This role cannot access data management',
            );
        }

        return user.organizationId;
    }

    private getYear(year?: string): number {
        if (!year) {
            return new Date().getUTCFullYear();
        }

        if (!/^\d{4}$/.test(year)) {
            throw new BadRequestException(
                'year must be in YYYY format',
            );
        }

        const parsedYear = Number(year);

        if (parsedYear < 2000 || parsedYear > 2100) {
            throw new BadRequestException('Invalid reporting year');
        }

        return parsedYear;
    }

    private getExpectedPeriods(frequency: DataFrequency): number {
        switch (frequency) {
            case DataFrequency.MONTHLY:
                return 12;

            case DataFrequency.QUARTERLY:
                return 4;

            case DataFrequency.ANNUAL:
                return 1;

            default:
                throw new BadRequestException(
                    'Unsupported KPI frequency',
                );
        }
    }

    private getCompletionStatus(
        frequency: DataFrequency,
        entries: Array<{
            periodKey: string;
            status: DataEntryStatus;
        }>,
    ): {
        status: ItemCompletionStatus;
        expectedPeriods: number;
        recordedPeriods: number;
        submittedPeriods: number;
        completionPercentage: number;
    } {
        const expectedPeriods = this.getExpectedPeriods(frequency);

        const recordedKeys = new Set(
            entries.map((entry) => entry.periodKey),
        );

        const submittedKeys = new Set(
            entries
                .filter(
                    (entry) =>
                        entry.status === DataEntryStatus.SUBMITTED,
                )
                .map((entry) => entry.periodKey),
        );

        const recordedPeriods = recordedKeys.size;
        const submittedPeriods = submittedKeys.size;

        let status: ItemCompletionStatus;

        if (submittedPeriods >= expectedPeriods) {
            status = 'COMPLETE';
        } else if (recordedPeriods > 0) {
            status = 'IN_PROGRESS';
        } else {
            status = 'MISSING';
        }

        return {
            status,
            expectedPeriods,
            recordedPeriods,
            submittedPeriods,
            completionPercentage: Math.min(
                100,
                Number(
                    (
                        (submittedPeriods / expectedPeriods) *
                        100
                    ).toFixed(1),
                ),
            ),
        };
    }

    private getDepartmentStatus(
        total: number,
        complete: number,
        missing: number,
    ): 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED' {
        if (total === 0 || missing === total) {
            return 'NOT_STARTED';
        }

        if (complete === total) {
            return 'COMPLETE';
        }

        return 'IN_PROGRESS';
    }

    private getPercentage(
        completed: number,
        total: number,
    ): number {
        if (total === 0) {
            return 0;
        }

        return Number(
            ((completed / total) * 100).toFixed(1),
        );
    }

    private async ensureEmployeeAccess(
        user: CurrentUser,
        organizationId: string,
    ): Promise<string | null> {
        if (user.role === UserRole.ORG_ADMIN) {
            return null;
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

        if (!employee?.departmentId) {
            throw new ForbiddenException(
                'Employee is not assigned to an active department',
            );
        }

        return employee.departmentId;
    }

    private async ensureDepartmentAccess(
        user: CurrentUser,
        organizationId: string,
        departmentId: string,
    ) {
        const department = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                organizationId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                sortOrder: true,
            },
        });

        if (!department) {
            throw new NotFoundException('Department not found');
        }

        const employeeDepartmentId =
            await this.ensureEmployeeAccess(user, organizationId);

        if (
            employeeDepartmentId &&
            employeeDepartmentId !== departmentId
        ) {
            throw new ForbiddenException(
                'You cannot access another department',
            );
        }

        return department;
    }


    private getDepartmentDescription(name: string): string {
        const descriptions: Record<string, string> = {
            'Human Resources':
                'People, workforce information and employee development.',

            'HR':
                'People, workforce information and employee development.',

            'Engineering':
                'Engineering operations, resources and equipment data.',

            'Transportation':
                'Transport activities, fleet resources and movement.',

            'HSE':
                'Health, safety and environmental activities.',

            'House Keeping':
                'Housekeeping activities and workplace resources.',

            'Legal Function':
                'Legal responsibilities and organizational records.',

            'Internal Audit':
                'Internal controls, audit activities and organizational assurance.',

            'Compliance':
                'Regulatory requirements, compliance activities and related records.',

            'Supply Chain':
                'Supplier relationships, procurement and supply chain activities.',

            'Guest Relations':
                'Guest satisfaction, feedback and customer-related activities.',

            'IT':
                'Information technology, digital infrastructure and data security.',
        };

        return descriptions[name] ??
            'ESG data collection and reporting activities for this department.';
    }


    // ==========================================
    // LOAD DATA ITEMS AND THEIR ENTRIES
    // ==========================================

    private async loadDepartmentItems(
        organizationId: string,
        year: number,
        departmentIds?: string[],
    ) {
        const periodStart = new Date(Date.UTC(year, 0, 1));
        const periodEnd = new Date(Date.UTC(year + 1, 0, 1));

        const items = await this.prisma.dataItem.findMany({
            where: {
                organizationId,
                isActive: true,

                ...(departmentIds && {
                    departmentId: {
                        in: departmentIds,
                    },
                }),

                department: {
                    organizationId,
                    isActive: true,
                },
            },

            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                category: true,
                unit: true,
                frequency: true,
                sortOrder: true,
                departmentId: true,

                dataEntries: {
                    where: {
                        organizationId,
                        periodStart: {
                            gte: periodStart,
                            lt: periodEnd,
                        },
                    },
                    select: {
                        periodKey: true,
                        status: true,
                    },
                },
            },

            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' },
            ],
        });

        return items.map((item) => {
            const completion = this.getCompletionStatus(
                item.frequency,
                item.dataEntries,
            );

            return {
                id: item.id,
                code: item.code,
                name: item.name,
                description: item.description,
                category: item.category,
                unit: item.unit,
                frequency: item.frequency,
                departmentId: item.departmentId,

                status: completion.status,
                expectedPeriods: completion.expectedPeriods,
                recordedPeriods: completion.recordedPeriods,
                submittedPeriods: completion.submittedPeriods,
                completionPercentage: completion.completionPercentage,

                context: item.description,
            };
        });
    }

    private getStatistics(
        items: Array<{ status: ItemCompletionStatus }>,
    ) {
        const total = items.length;

        const complete = items.filter(
            (item) => item.status === 'COMPLETE',
        ).length;

        const inProgress = items.filter(
            (item) => item.status === 'IN_PROGRESS',
        ).length;

        const missing = items.filter(
            (item) => item.status === 'MISSING',
        ).length;

        return {
            total,
            complete,
            inProgress,
            missing,
            completionPercentage: this.getPercentage(
                complete,
                total,
            ),
        };
    }

    // ==========================================
    // 1. GET DATA MANAGEMENT OVERVIEW
    // ==========================================

    async getOverview(
        user: CurrentUser,
        requestedYear?: string,
    ) {
        const organizationId = this.getOrganizationId(user);
        const year = this.getYear(requestedYear);

        const employeeDepartmentId =
            await this.ensureEmployeeAccess(user, organizationId);

        const departments = await this.prisma.department.findMany({
            where: {
                organizationId,
                isActive: true,

                ...(employeeDepartmentId && {
                    id: employeeDepartmentId,
                }),
            },
            select: {
                id: true,
                name: true,
                sortOrder: true,
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' },
            ],
        });

        const departmentIds = departments.map(
            (department) => department.id,
        );

        const items = await this.loadDepartmentItems(
            organizationId,
            year,
            departmentIds,
        );

        const itemsByDepartment = new Map<
            string,
            typeof items
        >();

        for (const departmentId of departmentIds) {
            itemsByDepartment.set(departmentId, []);
        }

        for (const item of items) {
            const departmentItems =
                itemsByDepartment.get(item.departmentId);

            departmentItems?.push(item);
        }

        const departmentCards = departments.map((department) => {
            const departmentItems =
                itemsByDepartment.get(department.id) ?? [];

            const stats = this.getStatistics(departmentItems);

            return {
                id: department.id,
                name: department.name,
                description: this.getDepartmentDescription(department.name),

                totalDataItems: stats.total,
                completedData: stats.complete,
                inProgressData: stats.inProgress,
                missingData: stats.missing,

                completionPercentage: stats.completionPercentage,

                status: this.getDepartmentStatus(
                    stats.total,
                    stats.complete,
                    stats.missing,
                ),
            };
        });

        const overallStats = this.getStatistics(items);

        return {
            message: 'Data management overview retrieved successfully',

            data: {
                reportingYear: year,

                summary: {
                    totalDepartments: departments.length,
                    totalDataItems: overallStats.total,
                    completedData: overallStats.complete,
                    inProgressData: overallStats.inProgress,
                    missingData: overallStats.missing,
                    overallCompletionPercentage:
                        overallStats.completionPercentage,
                },

                departments: departmentCards,
            },
        };
    }

    // ==========================================
    // 2. GET DEPARTMENT DETAILS
    // ==========================================

    async getDepartmentDetails(
        user: CurrentUser,
        departmentId: string,
        requestedYear?: string,
    ) {
        const organizationId = this.getOrganizationId(user);
        const year = this.getYear(requestedYear);

        const department = await this.ensureDepartmentAccess(
            user,
            organizationId,
            departmentId,
        );

        const items = await this.loadDepartmentItems(
            organizationId,
            year,
            [departmentId],
        );

        const stats = this.getStatistics(items);

        const pageSize = 10;
        const firstPageItems = items.slice(0, pageSize);

        return {
            message: 'Department details retrieved successfully',

            data: {
                reportingYear: year,

                department: {
                    id: department.id,
                    name: department.name,
                    sortOrder: department.sortOrder,
                },

                statistics: {
                    totalDataItems: stats.total,
                    completedData: stats.complete,
                    inProgressData: stats.inProgress,
                    missingData: stats.missing,
                    completionPercentage:
                        stats.completionPercentage,

                    status: this.getDepartmentStatus(
                        stats.total,
                        stats.complete,
                        stats.missing,
                    ),
                },

                items: firstPageItems,

                pagination: {
                    page: 1,
                    limit: pageSize,
                    totalItems: items.length,
                    totalPages: Math.ceil(items.length / pageSize),
                },
            },
        };
    }

    // ==========================================
    // 3. GET DEPARTMENT DATA ITEMS
    // ==========================================

    async getDepartmentItems(
        user: CurrentUser,
        departmentId: string,
        filters: DataManagementFilters,
    ) {
        const organizationId = this.getOrganizationId(user);
        const year = this.getYear(filters.year);

        const department = await this.ensureDepartmentAccess(
            user,
            organizationId,
            departmentId,
        );

        const page = filters.page
            ? Number(filters.page)
            : 1;

        const limit = filters.limit
            ? Number(filters.limit)
            : 10;

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            throw new BadRequestException(
                'page must be >= 1 and limit must be between 1 and 100',
            );
        }

        let category: ESGCategory | undefined;
        let frequency: DataFrequency | undefined;
        let status: ItemCompletionStatus | undefined;

        if (filters.category) {
            if (
                !Object.values(ESGCategory).includes(
                    filters.category as ESGCategory,
                )
            ) {
                throw new BadRequestException(
                    'Invalid ESG category',
                );
            }

            category = filters.category as ESGCategory;
        }

        if (filters.frequency) {
            if (
                !Object.values(DataFrequency).includes(
                    filters.frequency as DataFrequency,
                )
            ) {
                throw new BadRequestException(
                    'Invalid data frequency',
                );
            }

            frequency = filters.frequency as DataFrequency;
        }

        if (filters.status) {
            const allowedStatuses = [
                'COMPLETE',
                'IN_PROGRESS',
                'MISSING',
            ];

            if (!allowedStatuses.includes(filters.status)) {
                throw new BadRequestException(
                    'status must be COMPLETE, IN_PROGRESS, or MISSING',
                );
            }

            status = filters.status as ItemCompletionStatus;
        }

        const allItems = await this.loadDepartmentItems(
            organizationId,
            year,
            [departmentId],
        );

        let filteredItems = allItems;

        if (filters.search?.trim()) {
            const search = filters.search.trim().toLowerCase();

            filteredItems = filteredItems.filter((item) => {
                return (
                    item.name.toLowerCase().includes(search) ||
                    item.code.toLowerCase().includes(search) ||
                    (item.description ?? '')
                        .toLowerCase()
                        .includes(search)
                );
            });
        }

        if (category) {
            filteredItems = filteredItems.filter(
                (item) => item.category === category,
            );
        }

        if (frequency) {
            filteredItems = filteredItems.filter(
                (item) => item.frequency === frequency,
            );
        }

        if (status) {
            filteredItems = filteredItems.filter(
                (item) => item.status === status,
            );
        }

        const totalItems = filteredItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        const paginatedItems = filteredItems.slice(
            skip,
            skip + limit,
        );

        return {
            message: 'Department data items retrieved successfully',

            data: {
                reportingYear: year,

                department: {
                    id: department.id,
                    name: department.name,
                },

                items: paginatedItems,

                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },

                filters: {
                    search: filters.search || null,
                    category: category || null,
                    frequency: frequency || null,
                    status: status || null,
                },
            },
        };
    }
}
