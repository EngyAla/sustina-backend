import { Module } from '@nestjs/common';
import { SectorsController } from './sectors.controller.js';
import { SectorsService } from './sectors.service.js';
import { IndustriesController } from './industries.controller.js';

@Module({
  controllers: [
    SectorsController,
    IndustriesController
  ],
  providers: [SectorsService]
})
export class SectorsModule {}
