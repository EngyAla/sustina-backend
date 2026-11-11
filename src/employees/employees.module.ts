
import { Module } from '@nestjs/common';

import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';

import { OrgAdminGuard } from './guards/org-admin.guard.js';

@Module({
    controllers: [EmployeesController],
    providers: [
        EmployeesService,
        OrgAdminGuard,
    ],
})
export class EmployeesModule {}
