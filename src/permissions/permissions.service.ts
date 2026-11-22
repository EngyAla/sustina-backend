import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { QueryPermissionsDto } from './dto/query-permissions.dto.js';

@Injectable()
export class PermissionsService {
    constructor(private readonly prisma: PrismaService) {}

    // ==========================================
    // CREATE PERMISSION
    // ==========================================

    async create(
        organizationId: string,
        dto: CreatePermissionDto,
    ) {
        try {
        const permission = await this.prisma.permission.create({
            data: {
                name: dto.name.trim(),
                description: dto.description?.trim() || null,
                organizationId,
                    operations: {
                        create: dto.operations.map((operation) => ({
                        operation,
                        })),
                    },
                },
                include: {
                operations: true,
                _count: {
                    select: {
                    assignedEmployees: true,
                    },
                },
            },
        });

        return {
            message: 'Permission created successfully.',
            data: permission,
        };
        } catch (error) {
        // Unique constraint: same name in the same organization
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            throw new ConflictException(
            'A permission with this name already exists.',
            );
        }

        throw error;
        }
    }

    // ==========================================
    // GET ALL PERMISSIONS
    // Search + Status Filter + Pagination
    // ==========================================

    async findAll(
        organizationId: string,
        query: QueryPermissionsDto,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {
        organizationId,
        };

        // Search by permission name or description
        if (query.search?.trim()) {
        where.OR = [
            {
            name: {
                contains: query.search.trim(),
                mode: 'insensitive',
            },
            },
            {
            description: {
                contains: query.search.trim(),
                mode: 'insensitive',
            },
            },
        ];
        }

        // Status filter
        if (query.status === 'ACTIVE') {
        where.isActive = true;
        } else if (query.status === 'INACTIVE') {
        where.isActive = false;
        }

        const [permissions, total] = await Promise.all([
        this.prisma.permission.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
            createdAt: 'desc',
            },
            include: {
            operations: true,
            _count: {
                select: {
                assignedEmployees: true,
                },
            },
            },
        }),

        this.prisma.permission.count({ where }),
        ]);

        return {
        data: permissions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        };
    }

    // ==========================================
    // GET PERMISSION DETAILS
    // ==========================================

    async findOne(
        organizationId: string,
        permissionId: string,
    ) {
        const permission = await this.prisma.permission.findFirst({
        where: {
            id: permissionId,
            organizationId,
        },
        include: {
            operations: true,
            assignedEmployees: {
            include: {
                user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    department: {
                    select: {
                        id: true,
                        name: true,
                    },
                    },
                },
                },
            },
            },
            _count: {
            select: {
                assignedEmployees: true,
            },
            },
        },
        });

        if (!permission) {
        throw new NotFoundException('Permission not found.');
        }

        return {
        data: permission,
        };
    }

    // ==========================================
    // UPDATE PERMISSION
    // ==========================================

    async update(
        organizationId: string,
        permissionId: string,
        dto: UpdatePermissionDto,
    ) {
        // Verify that the permission belongs to this organization
        const existingPermission = await this.prisma.permission.findFirst({
        where: {
            id: permissionId,
            organizationId,
        },
        });

        if (!existingPermission) {
        throw new NotFoundException('Permission not found.');
        }

        if (dto.name !== undefined && !dto.name.trim()) {
        throw new BadRequestException(
            'Permission name cannot be empty.',
        );
        }

        try {
        const updatedPermission = await this.prisma.permission.update({
            where: {
            id: permissionId,
            organizationId,
            },
            data: {
            ...(dto.name !== undefined && {
                name: dto.name.trim(),
            }),

            ...(dto.description !== undefined && {
                description: dto.description.trim() || null,
            }),

            ...(dto.operations !== undefined && {
                operations: {
                deleteMany: {},
                create: dto.operations.map((operation) => ({
                    operation,
                })),
                },
            }),
            },
            include: {
            operations: true,
            _count: {
                select: {
                assignedEmployees: true,
                },
            },
            },
        });

        return {
            message: 'Permission updated successfully.',
            data: updatedPermission,
        };
        } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            throw new ConflictException(
            'A permission with this name already exists.',
            );
        }

        throw error;
        }
    }

    // ==========================================
    // ACTIVATE PERMISSION
    // ==========================================

    async activate(
        organizationId: string,
        permissionId: string,
    ) {
        const permission = await this.prisma.permission.findFirst({
        where: {
            id: permissionId,
            organizationId,
        },
        });

        if (!permission) {
        throw new NotFoundException('Permission not found.');
        }

        if (permission.isActive) {
        throw new BadRequestException(
            'Permission is already active.',
        );
        }

        const updatedPermission = await this.prisma.permission.update({
        where: {
            id: permissionId,
            organizationId,
        },
        data: {
            isActive: true,
        },
        });

        return {
        message: 'Permission activated successfully.',
        data: updatedPermission,
        };
    }

    // ==========================================
    // DEACTIVATE PERMISSION
    // ==========================================

    async deactivate(
        organizationId: string,
        permissionId: string,
    ) {
        const permission = await this.prisma.permission.findFirst({
        where: {
            id: permissionId,
            organizationId,
        },
        });

        if (!permission) {
        throw new NotFoundException('Permission not found.');
        }

        if (!permission.isActive) {
        throw new BadRequestException(
            'Permission is already inactive.',
        );
        }

        const updatedPermission = await this.prisma.permission.update({
        where: {
            id: permissionId,
            organizationId,
        },
        data: {
            isActive: false,
        },
        });

        return {
        message: 'Permission deactivated successfully.',
        data: updatedPermission,
        };
    }

    // ==========================================
    // DELETE PERMISSION
    // ==========================================

    async remove(
        organizationId: string,
        permissionId: string,
    ) {
        const permission = await this.prisma.permission.findFirst({
        where: {
            id: permissionId,
            organizationId,
        },
        include: {
            _count: {
            select: {
                assignedEmployees: true,
            },
            },
        },
        });

        if (!permission) {
        throw new NotFoundException('Permission not found.');
        }

        if (permission._count.assignedEmployees > 0) {
        throw new BadRequestException(
            `Cannot delete this permission because it is assigned to ${permission._count.assignedEmployees} employee(s). Reassign employees first.`,
        );
        }

        await this.prisma.permission.delete({
        where: {
            id: permissionId,
            organizationId,
        },
        });

        return {
        message: 'Permission deleted successfully.',
        };
    }
}