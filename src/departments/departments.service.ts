import {
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DepartmentsService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async findMyDepartments(organizationId: string | null) {
        // SUPER_ADMIN accounts do not belong to an organization.
        if (!organizationId) {
            throw new ForbiddenException(
                'You are not associated with an organization',
            );
        }

        const departments = await this.prisma.department.findMany({
            where: {
                organizationId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                sortOrder: true,
            },
            orderBy: [
                {sortOrder: 'asc'},
                {name: 'asc'},
            ],
        });

        return {
        departments,
        total: departments.length,
        };
    }
}
