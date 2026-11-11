import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';

import {
    EmployeePermissionType,
    UserRole,
    UserStatus,
} from '../generated/prisma/client.js';

import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';

@Injectable()
export class EmployeesService {
    constructor(private readonly prisma: PrismaService) {}

    // -----------------------------------------
    // Helpers
    // -----------------------------------------
    private async validateDepartment(
        departmentId: string,
        organizationId: string,
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
        },
        });

        if (!department) {
            throw new BadRequestException(
                'Department does not exist or is inactive',
            );
        }

        return department;
    }

    private async findEmployee(
        employeeId: string,
        organizationId: string,
    ) {
        const employee = await this.prisma.user.findFirst({
        where: {
            id: employeeId,
            organizationId,
            role: UserRole.ORG_MEMBER,
            deletedAt: null,
        },
        include: {
            department: {
            select: {
                id: true,
                name: true,
            },
            },
            permissions: {
            select: {
                permission: true,
            },
            },
        },
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        return employee;
    }

    // -----------------------------------------
    // 1. Get All Employees
    // -----------------------------------------
    async findAll(
        organizationId: string,
        query: QueryEmployeesDto,
    ) {
        const {
        page = 1,
        limit = 10,
        search,
        departmentId,
        status,
        } = query;

        const skip = (page - 1) * limit;

        const where = {
        organizationId,
        role: UserRole.ORG_MEMBER,
        deletedAt: null,

        ...(status && { status }),

        ...(departmentId && { departmentId }),

        ...(search && {
            OR: [
            {
                firstName: {
                contains: search,
                mode: 'insensitive' as const,
                },
            },
            {
                lastName: {
                contains: search,
                mode: 'insensitive' as const,
                },
            },
            {
                email: {
                contains: search,
                mode: 'insensitive' as const,
                },
            },
            ],
        }),
        };

        const [employees, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                createdAt: true,
                department: {
                    select: {
                    id: true,
                    name: true,
                    },
                },
                permissions: {
                    select: {
                    permission: true,
                    },
                },
            },
        }),

        this.prisma.user.count({ where }),
        ]);

        return {
        employees: employees.map((employee) => ({
            ...employee,
            permissions: employee.permissions.map(
            (item) => item.permission,
            ),
        })),

        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        };
    }

    // -----------------------------------------
    // 2. Create Employee
    // -----------------------------------------
    async create(
        organizationId: string,
        dto: CreateEmployeeDto,
    ) {
        const email = dto.email.trim().toLowerCase();

        // Check email globally because User.email is globally unique.
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            throw new ConflictException(
                'This email is already registered',
            );
        }

        await this.validateDepartment(
        dto.departmentId,
        organizationId,
        );

        const employee = await this.prisma.$transaction(
        async (tx) => {
            const user = await tx.user.create({
            data: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                email,
                organizationId,
                departmentId: dto.departmentId,
                role: UserRole.ORG_MEMBER,
                status: UserStatus.PENDING,
                passwordHash: null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                departmentId: true,
                createdAt: true,
            },
            });

            await tx.userPermission.createMany({
                data: dto.permissions.map((permission) => ({
                    userId: user.id,
                    permission,
                })),
            });

            return tx.user.findUniqueOrThrow({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                department: {
                select: {
                    id: true,
                    name: true,
                },
                },
                permissions: {
                select: {
                    permission: true,
                },
                },
            },
            });
        },
        );

        return {
        message: 'Employee created successfully',
        employee: {
            ...employee,
            permissions: employee.permissions.map(
            (item) => item.permission,
            ),
        },
        };
    }

    // -----------------------------------------
    // 3. Get Employee By ID
    // -----------------------------------------
    async findOne(
        employeeId: string,
        organizationId: string,
    ) {
        const employee = await this.findEmployee(
        employeeId,
        organizationId,
        );

        return {
        employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            role: employee.role,
            status: employee.status,
            department: employee.department,
            permissions: employee.permissions.map(
            (item) => item.permission,
            ),
            lastLoginAt: employee.lastLoginAt,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt,
        },
        };
    }

    // -----------------------------------------
    // 4. Update Employee
    // -----------------------------------------
    async update(
        employeeId: string,
        organizationId: string,
        dto: UpdateEmployeeDto,
    ) {
        await this.findEmployee(employeeId, organizationId);

        if (dto.departmentId) {
        await this.validateDepartment(
            dto.departmentId,
            organizationId,
        );
        }

        const passwordHash = dto.password
        ? await bcrypt.hash(dto.password, 12)
        : undefined;

        const employee = await this.prisma.$transaction(
        async (tx) => {
            const user = await tx.user.update({
            where: {
                id: employeeId,
            },
            data: {
                ...(dto.firstName !== undefined && {
                firstName: dto.firstName.trim(),
                }),

                ...(dto.lastName !== undefined && {
                lastName: dto.lastName.trim(),
                }),

                ...(dto.departmentId && {
                departmentId: dto.departmentId,
                }),

                ...(passwordHash && {
                passwordHash,
                }),
            },
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
                updatedAt: true,
            },
            });

            if (dto.permissions !== undefined) {
            await tx.userPermission.deleteMany({
                where: { userId: employeeId },
            });

            if (dto.permissions.length > 0) {
                await tx.userPermission.createMany({
                data: dto.permissions.map((permission) => ({
                    userId: employeeId,
                    permission,
                })),
                });
            }
            }

            // Password changes invalidate existing sessions.
            if (passwordHash) {
            await tx.refreshSession.updateMany({
                where: {
                userId: employeeId,
                revokedAt: null,
                },
                data: {
                revokedAt: new Date(),
                },
            });
            }

            const permissions = await tx.userPermission.findMany({
            where: { userId: employeeId },
            select: { permission: true },
            });

            return {
            ...user,
            permissions: permissions.map(
                (item) => item.permission,
            ),
            };
        },
        );

        return {
        message: 'Employee updated successfully',
        employee,
        };
    }

    // -----------------------------------------
    // 5. Deactivate Employee
    // -----------------------------------------
    async deactivate(
        employeeId: string,
        organizationId: string,
    ) {
        const employee = await this.findEmployee(
        employeeId,
        organizationId,
        );

        if (employee.status !== UserStatus.ACTIVE) {
            throw new BadRequestException(
                'Only active employees can be deactivated',
            );
        }

        await this.prisma.$transaction([
        this.prisma.user.update({
            where: { id: employeeId },
            data: {
            status: UserStatus.SUSPENDED,
            },
        }),

        this.prisma.refreshSession.updateMany({
            where: {
            userId: employeeId,
            revokedAt: null,
            },
            data: {
            revokedAt: new Date(),
            },
        }),
        ]);

        return {
        message: 'Employee deactivated successfully',
        };
    }

    // -----------------------------------------
    // 6. Activate Employee
    // -----------------------------------------
    async activate(
        employeeId: string,
        organizationId: string,
    ) {
        const employee = await this.findEmployee(
        employeeId,
        organizationId,
        );

        if (employee.status !== UserStatus.SUSPENDED) {
            throw new BadRequestException(
                'Only suspended employees can be activated',
            );
        }

        if (!employee.passwordHash) {
            throw new BadRequestException(
                'Employee must complete account setup before activation',
            );
        }

        await this.prisma.user.update({
        where: { id: employeeId },
        data: {
            status: UserStatus.ACTIVE,
        },
        });

        return {
        message: 'Employee activated successfully',
        };
    }

    // -----------------------------------------
    // 7. Soft Delete Employee
    // -----------------------------------------
    async remove(
        employeeId: string,
        organizationId: string,
    ) {
        await this.findEmployee(employeeId, organizationId);

        const deletedAt = new Date();

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: employeeId },
                data: {
                deletedAt,
                status: UserStatus.SUSPENDED,
                },
            }),

            this.prisma.refreshSession.updateMany({
                where: {
                userId: employeeId,
                revokedAt: null,
                },
                data: {
                revokedAt: deletedAt,
                },
            }),

            this.prisma.employeeInvitation.updateMany({
                where: {
                    userId: employeeId,
                    usedAt: null,
                },
                data: {
                    usedAt: deletedAt,
                },
            }),
        ]);

        return {
        message: 'Employee deleted successfully',
        };
    }
}
