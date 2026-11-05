import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';

import { SectorsService } from './sectors.service.js';

@Controller('industries')
export class IndustriesController {
    constructor(private readonly sectorsService: SectorsService) {}

    // GET /api/industries/:industryId/sub-industries
    @Get(':industryId/sub-industries')
    findSubIndustriesByIndustry(
        @Param('industryId', ParseUUIDPipe) industryId: string,
    ) {
        return this.sectorsService.findSubIndustriesByIndustry(industryId);
    }
}