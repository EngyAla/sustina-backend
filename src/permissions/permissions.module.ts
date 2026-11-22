import { Module } from '@nestjs/common';

import { PermissionsController } from './permissions.controller.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { PermissionsService } from './permissions.service.js';

@Module({
    controllers: [PermissionsController],
    providers: [
        PermissionsService,
        PrismaService,
    ],
})
export class PermissionsModule {}