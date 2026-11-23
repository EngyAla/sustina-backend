import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { PermissionsGuard } from './guards/permissions.guard.js';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [PermissionsGuard],
    exports: [PermissionsGuard],
})
export class CommonModule {}