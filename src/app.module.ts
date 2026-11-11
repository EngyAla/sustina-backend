import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SectorsModule } from './sectors/sectors.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { RegistrationModule } from './registration/registration.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { MalwareScannerModule } from './malware-scanner/malware-scanner.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { EmployeesModule } from './employees/employees.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SectorsModule,
    OrganizationsModule,
    DocumentsModule,
    RegistrationModule,
    AuthModule,
    AdminModule,
    MalwareScannerModule,
    DepartmentsModule,
    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
