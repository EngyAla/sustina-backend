import { ConfigService } from '@nestjs/config';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import {
    createHash,
    randomBytes,
} from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';

import {
    EmployeePermissionType,
    UserRole,
    UserStatus,
} from '../generated/prisma/client.js';

import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';

import { MailService } from '../mail/mail.service.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';


@Injectable()
export class EmployeesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

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

    private hashInvitationToken(token: string): string {
        return createHash('sha256')
            .update(token)
            .digest('hex');
    }

    private generateInvitationToken(): string {
        return randomBytes(32).toString('hex');
    }

    private getInvitationExpiration(): Date {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
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

        const firstName = dto.firstName.trim();
        const lastName = dto.lastName.trim();

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

        const token = this.generateInvitationToken();
        const tokenHash = this.hashInvitationToken(token);

        const expiresAt = this.getInvitationExpiration();

        const employee = await this.prisma.$transaction(
            async (tx) => {
            const user = await tx.user.create({
                data: {
                firstName,
                lastName,
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
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                },
            });

            await tx.userPermission.createMany({
                data: dto.permissions.map((permission) => ({
                userId: user.id,
                permission,
                })),
            });

            await tx.employeeInvitation.create({
                data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                },
            });

            const employeeDetails = await tx.user.findUniqueOrThrow({
                where: { id: user.id },
                select: {
                id: true,
                firstName: true,
                lastName: true,
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

            return {
                ...employeeDetails,
                permissions: employeeDetails.permissions.map(
                (item) => item.permission,
                ),
            };
            },
        );

        // Send invitation after successful database transaction.
        try {
            await this.mailService.sendEmployeeInvitation(
            email,
            firstName,
            lastName,
            token,
            );
        } catch {
            throw new InternalServerErrorException(
            'Employee was created, but the invitation email could not be sent. Please resend the invitation.',
            );
        }

        return {
            message: 'Employee created and invitation email sent successfully',
            employee,
            invitation: {
            expiresAt,
            status: 'PENDING',
            },
        };
    }

    // -----------------------------------------
    // Accept Invitation
    // -----------------------------------------
    async acceptInvitation(dto: AcceptInvitationDto) {
        const tokenHash = this.hashInvitationToken(dto.token);

        const invitation = await this.prisma.employeeInvitation.findUnique({
            where: { tokenHash },
            include: {
                user: {
                    include: {
                        organization: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new BadRequestException(
                'Invitation is invalid or expired',
            );
        }

        if (invitation.usedAt) {
            throw new BadRequestException(
                'This invitation has already been used',
            );
        }

        if (invitation.expiresAt <= new Date()) {
            throw new BadRequestException(
                'Invitation has expired',
            );
        }

        const user = invitation.user;

        if (user.deletedAt) {
            throw new BadRequestException(
                'This employee account is no longer available',
            );
        }

        if (user.role !== UserRole.ORG_MEMBER) {
            throw new BadRequestException(
                'Invalid employee invitation',
            );
        }

        if (user.status !== UserStatus.PENDING) {
            throw new BadRequestException(
                'This account is not pending activation',
            );
        }

        if (user.passwordHash) {
            throw new ConflictException(
                'Account setup has already been completed',
            );
        }

        if (!user.organization || user.organization.status !== 'ACTIVE') {
            throw new BadRequestException(
                'The organization is not active',
            );
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const now = new Date();

        await this.prisma.$transaction(async (tx) => {
            // Re-check invitation inside transaction
            const currentInvitation =
                await tx.employeeInvitation.findUnique({
                    where: { id: invitation.id },
                });

            if (
                !currentInvitation ||
                currentInvitation.usedAt ||
                currentInvitation.expiresAt <= now
            ) {
                throw new BadRequestException(
                    'Invitation is invalid or expired',
                );
            }

            // Mark invitation as used
            await tx.employeeInvitation.update({
                where: { id: invitation.id },
                data: { usedAt: now },
            });

            // Set password and activate employee
            await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    status: UserStatus.ACTIVE,
                },
            });
        });

        return {
            message: 'Invitation accepted successfully. You can now log in.',
        };
    }

    // -----------------------------------------
    // Resend Invitation
    // -----------------------------------------
    async resendInvitation(
        employeeId: string,
        organizationId: string,
    ) {
        const employee = await this.findEmployee(
            employeeId,
            organizationId,
        );

        if (employee.status !== UserStatus.PENDING) {
            throw new BadRequestException(
                'Invitation can only be sent to pending employees',
            );
        }

        if (employee.passwordHash) {
            throw new BadRequestException(
                'Employee has already completed account setup',
            );
        }

        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                legalName: true,
                status: true,
            },
        });

        if (!organization || organization.status !== 'ACTIVE') {
            throw new BadRequestException(
                'Organization is not active',
            );
        }

        const invitationUrlBase =
            this.configService.getOrThrow<string>(
                'FRONTEND_EMPLOYEE_INVITATION_URL',
            );

        const expirationHours = Number(
            this.configService.get<string>(
                'EMPLOYEE_INVITATION_EXPIRES_HOURS',
                '48',
            ),
        );

        if (
            !Number.isInteger(expirationHours) ||
            expirationHours < 1 ||
            expirationHours > 168
        ) {
            throw new BadRequestException(
                'Invalid invitation expiration configuration',
            );
        }

        const rawToken = this.generateInvitationToken();
        const tokenHash = this.hashInvitationToken(rawToken);

        const expiresAt = new Date(
            Date.now() + expirationHours * 60 * 60 * 1000,
        );

        await this.prisma.employeeInvitation.upsert({
            where: {
                userId: employeeId,
            },
            update: {
                tokenHash,
                expiresAt,
                usedAt: null,
            },
            create: {
                userId: employeeId,
                tokenHash,
                expiresAt,
            },
        });

        const invitationUrl = new URL(
            invitationUrlBase,
        );

        invitationUrl.searchParams.set('token', rawToken);

        await this.mailService.sendEmployeeInvitation(
            employee.email,
            employee.firstName ?? 'Employee',
            organization.legalName,
            invitationUrl.toString(),
        );

        return {
            message: 'Invitation sent successfully',
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
