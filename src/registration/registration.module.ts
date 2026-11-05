import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller.js';
import { RegistrationService } from './registration.service.js';
import { DocumentsModule } from '../documents/documents.module.js';

@Module({
  imports: [DocumentsModule],
  controllers: [RegistrationController],
  providers: [RegistrationService]
})
export class RegistrationModule {}
