import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY, AppRole } from '../decorators/roles.decorator.js';

interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        role: AppRole;
        organizationId: string | null;
    };
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
        ROLES_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ],
        );

        // لو مفيش Roles محددة، نسمح بالمرور
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

        const user = request.user;

        if (!user) {
            return false;
        }

        return requiredRoles.includes(user.role);
    }
}