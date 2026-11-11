import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class OrgAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const user = request.user;

        if (!user) {
            throw new UnauthorizedException();
        }

        if (user.role !== 'ORG_ADMIN') {
            throw new ForbiddenException(
                'Only organization administrators can manage employees',
            );
        }

        if (!user.organizationId) {
            throw new ForbiddenException(
                'User is not associated with an organization',
            );
        }

        return true;
    }
}
