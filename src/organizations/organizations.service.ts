import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMyOrganization(organizationId: string | null) {
        if (!organizationId) {
            throw new ForbiddenException(
                'This account is not associated with an organization',
            );
        }

        const organization = await this.prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            legalName: true,
            hqCountry: true,
            firstReportingYear: true,
            status: true,
            subIndustryId: true,
            createdAt: true,
            updatedAt: true,
        },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization;
    }
}