import { Module } from '@nestjs/common';

import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';

import { OrgAdminGuard } from './guards/org-admin.guard.js';
import { MailModule } from '../mail/mail.module.js';
import { EmployeeInvitationsController } from './controllers/employee-invitations.controller.js';

@Module({
    imports: [MailModule],
    controllers: [
        EmployeesController,
        EmployeeInvitationsController
    ],
    providers: [
        EmployeesService,
        OrgAdminGuard,
    ],
})
export class EmployeesModule {}
