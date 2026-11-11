import {
    BadRequestException,
    ConflictException,
    Injectable,
} from '@nestjs/common';

import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentsService } from '../documents/documents.service.js';

import { RegisterOrganizationDto } from './dto/register-organization.dto.js';
import { DEFAULT_DEPARTMENTS } from '../departments/default-departments.js';

@Injectable()
export class RegistrationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService,
    ) {}

    async registerOrganization(
        dto: RegisterOrganizationDto,
        file: Express.Multer.File,
    ) {
        // 1. Validate password confirmation
        if (dto.password !== dto.confirmPassword) {
            throw new BadRequestException(
                'Password and confirm password do not match',
            );
        }

        // 2. Check whether the email is already registered
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
            select: {
                id: true,
            },
        });

        if (existingUser) {
            throw new ConflictException(
                'This email is already registered',
            );
        }

        // 3. Validate the selected SubIndustry and its parents
        const subIndustry = await this.prisma.subIndustry.findFirst({
            where: {
                id: dto.subIndustryId,
                isActive: true,
                industry: {
                    isActive: true,
                    sector: {
                        isActive: true,
                    },
                },
            },
            select: {
                id: true
            },
        });

        if (!subIndustry) {
            throw new BadRequestException(
                'Selected SubIndustry is invalid or inactive',
            );
        }

        // 4. Hash the password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // 5. Upload the verification document
        const uploadedDocument =
        await this.documentsService.uploadVerificationDocument(file);

        // 6. Generate a registration reference code
        const referenceCode = this.generateReferenceCode();

        try {
        // 7. Create all database records in one transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    legalName: dto.legalName,
                    hqCountry: dto.hqCountry,
                    firstReportingYear: dto.firstReportingYear,
                    subIndustryId: dto.subIndustryId,
                    status: 'PENDING',
                },
                select: {
                    id: true,
                    legalName: true,
                    status: true,
                    hqCountry: true,
                    firstReportingYear: true,
                },
            });

            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    role: 'ORG_ADMIN',
                    status: 'PENDING',
                    organizationId: organization.id,
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                },
            });

            const registrationRequest =
            await tx.registrationRequest.create({
                data: {
                    referenceCode,
                    organizationId: organization.id,
                    submittedById: user.id,
                    status: 'PENDING',
                    termsAcceptedAt: new Date(),
                    authorityAttestedAt: new Date(),
                },
                select: {
                    id: true,
                    referenceCode: true,
                    status: true,
                    submittedAt: true,
                },
            });

            const document = await tx.organizationDocument.create({
                data: {
                    organizationId: organization.id,
                    registrationRequestId: registrationRequest.id,
                    originalFileName: uploadedDocument.originalFileName,
                    mimeType: uploadedDocument.mimeType,
                    sizeBytes: uploadedDocument.sizeBytes,
                    cloudinaryPublicId:
                    uploadedDocument.cloudinaryPublicId,
                    secureUrl: uploadedDocument.secureUrl,
                    sha256: uploadedDocument.sha256,
                    scanStatus: uploadedDocument.scanStatus,
                },
                select: {
                    id: true,
                    originalFileName: true,
                    sha256: true,
                    scanStatus: true,
                },
            });
            await tx.department.createMany({
                data: DEFAULT_DEPARTMENTS.map((name, index) => ({
                    name,
                    organizationId: organization.id,
                    sortOrder: index + 1,
                })),
            });

            return {
            organization,
            user,
            registrationRequest,
            document,
            };
        });
        

        // 8. Return safe registration information
        return {
            message: 'Organization registration submitted successfully',

            registration: {
                id: result.registrationRequest.id,
                referenceCode: result.registrationRequest.referenceCode,
                status: result.registrationRequest.status,
                submittedAt: result.registrationRequest.submittedAt,
            },

            organization: result.organization,

            admin: {
                email: result.user.email,
                status: result.user.status,
            },

            document: result.document,
        };
        } catch (error) {
        // Database transaction failed: remove uploaded file
        await this.documentsService.deleteVerificationDocument(
            uploadedDocument.cloudinaryPublicId,
        );

        // Handle unique constraint errors, including concurrent requests
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            throw new ConflictException(
            'This email or registration reference is already in use',
            );
        }

        throw error;
        }
    }

    private generateReferenceCode(): string {
        const year = new Date().getFullYear();

        const randomCode = randomBytes(4)
        .toString('hex')
        .toUpperCase();

        return `SUS-REG-${year}-${randomCode}`;
    }
}