import { SetMetadata } from '@nestjs/common';

export type AppRole =
    | 'SUPER_ADMIN'
    | 'ORG_ADMIN'
    | 'ORG_MEMBER';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]) =>
    SetMetadata(ROLES_KEY, roles);