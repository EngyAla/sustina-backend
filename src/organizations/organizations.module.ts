import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';

@Module({
  providers: [OrganizationsService]
})
export class OrganizationsModule {}
