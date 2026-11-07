import { Module } from '@nestjs/common';

import { RegistrationsController } from './registrations/registrations.controller.js';
import { RegistrationsService } from './registrations/registrations.service.js';

import { AuthModule } from '../auth/auth.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    AuthModule,
    DocumentsModule,
    MailModule,
  ],
  controllers: [
    RegistrationsController,
  ],
  providers: [
    RegistrationsService,
  ],
})
export class AdminModule {}