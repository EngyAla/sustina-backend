import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { DataManagementController } from './data-management.controller.js';
import { DataManagementService } from './data-management.service.js';

@Module({
    imports: [
        AuthModule,
    ],
    controllers: [
        DataManagementController,
    ],
    providers: [
        DataManagementService,
    ],
})
export class DataManagementModule {}
