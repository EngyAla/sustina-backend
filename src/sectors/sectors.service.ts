
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SectorsService {
    constructor(private readonly prisma: PrismaService) {}

    // Get all active sectors
    async findAllSectors() {
        return this.prisma.sector.findMany({
        where: {
            isActive: true,
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            sortOrder: 'asc',
        },
        });
    }

    // Get active industries belonging to a sector
    async findIndustriesBySector(sectorId: string) {
        const sector = await this.prisma.sector.findUnique({
        where: {
            id: sectorId,
        },
        select: {
            id: true,
        },
        });

        if (!sector) {
        throw new NotFoundException('Sector not found');
        }

        return this.prisma.industry.findMany({
        where: {
            sectorId,
            isActive: true,
            sector: {
            isActive: true,
            },
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            sortOrder: 'asc',
        },
        });
    }

    // Get active sub-industries belonging to an industry
    async findSubIndustriesByIndustry(industryId: string) {
        const industry = await this.prisma.industry.findUnique({
        where: {
            id: industryId,
        },
        select: {
            id: true,
        },
        });

        if (!industry) {
        throw new NotFoundException('Industry not found');
        }

        return this.prisma.subIndustry.findMany({
        where: {
            industryId,
            isActive: true,
            industry: {
            isActive: true,
            sector: {
                isActive: true,
            },
            },
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            sortOrder: 'asc',
        },
        });
    }
}