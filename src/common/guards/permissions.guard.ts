import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service.js';

import {
    EmployeePermissionType,
    UserRole,
} from '../../generated/prisma/enums.js';

import {
    REQUIRED_PERMISSION_KEY,
} from '../decorators/require-permission.decorator.js';

interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        organizationId: string | null;
    };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const requiredPermission =
            this.reflector.getAllAndOverride<EmployeePermissionType>(
                REQUIRED_PERMISSION_KEY,
                [
                    context.getHandler(),
                    context.getClass(),
                ],
            );

        // No permission requirement: allow this guard to pass.
        if (!requiredPermission) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const user = request.user;

        if (!user) {
            throw new UnauthorizedException(
                'Authentication is required',
            );
        }

        // Organization administrators manage employees and permissions.
        if (user.role === UserRole.ORG_ADMIN) {
            return true;
        }

        // Only organization members use employee permission assignments.
        if (user.role !== UserRole.ORG_MEMBER) {
            throw new ForbiddenException(
                'This role cannot access this resource',
            );
        }

        if (!user.organizationId) {
            throw new ForbiddenException(
                'User is not associated with an organization',
            );
        }

        // Read the current assignment and permission state from the database.
        const assignment =
            await this.prisma.employeePermissionAssignment.findFirst({
                where: {
                    userId: user.id,

                    permission: {
                        is: {
                            organizationId: user.organizationId,
                            isActive: true,

                            operations: {
                                some: {
                                    operation: requiredPermission,
                                },
                            },
                        },
                    },
                },

                select: {
                    id: true,
                },
            });

        if (!assignment) {
            throw new ForbiddenException(
                `You do not have the required permission: ${requiredPermission}`,
            );
        }

        return true;
    }
}