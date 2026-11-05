import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';

import { SectorsService } from './sectors.service.js';

@Controller('sectors')
export class SectorsController {
    constructor(private readonly sectorsService: SectorsService) {}

    // GET /api/sectors
    @Get()
    findAllSectors() {
        return this.sectorsService.findAllSectors();
    }

    // GET /api/sectors/:sectorId/industries
    @Get(':sectorId/industries')
    findIndustriesBySector(
        @Param('sectorId', ParseUUIDPipe) sectorId: string,
    ) {
        return this.sectorsService.findIndustriesBySector(sectorId);
    }
}
