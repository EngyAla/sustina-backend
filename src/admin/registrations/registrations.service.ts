import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

import { RegistrationQueryDto } from '../dto/registration-query.dto.js';
import { RejectRegistrationDto } from '../dto/reject-registration.dto.js';

import { DocumentsService } from '../../documents/documents.service.js';
import { MailService } from '../../mail/mail.service.js';

@Injectable()
export class RegistrationsService {
    private readonly logger = new Logger(RegistrationsService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService,
        private readonly mailService: MailService,
    ) {}

    // 1. Get registrations with pagination
    async findAll(query: RegistrationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;

        const skip = (page - 1) * limit;

        const where = query.status
        ? { status: query.status }
        : {};

        const [registrations, total] = await this.prisma.$transaction([
        this.prisma.registrationRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
            submittedAt: 'desc',
            },
            include: {
            organization: {
                select: {
                id: true,
                legalName: true,
                hqCountry: true,
                status: true,
                },
            },
            submittedBy: {
                select: {
                id: true,
                email: true,
                status: true,
                },
            },
            documents: {
                select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
                scanStatus: true,
                },
            },
            },
        }),

        this.prisma.registrationRequest.count({
            where,
        }),
        ]);

        return {
        data: registrations,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        };
    }

    // 2. Get registration details
    async findOne(referenceCode: string) {
        const registration =
        await this.prisma.registrationRequest.findUnique({
            where: {
            referenceCode,
            },
            include: {
            organization: {
                include: {
                subIndustry: {
                    include: {
                    industry: {
                        include: {
                        sector: true,
                        },
                    },
                    },
                },
                },
            },

            submittedBy: {
                select: {
                id: true,
                email: true,
                status: true,
                role: true,
                },
            },

            documents: {
                select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
                sha256: true,
                scanStatus: true,
                createdAt: true,
                },
            },

            reviewedBy: {
                select: {
                id: true,
                email: true,
                },
            },
            },
        });

        if (!registration) {
            throw new NotFoundException(
                'Registration request not found',
            );
        }

        return registration;
    }

    // 3. Approve registration
    async approve(
        referenceCode: string,
        reviewerId: string,
    ) {
        const result = await this.prisma.$transaction(
        async (tx) => {
            const registration =
            await tx.registrationRequest.findUnique({
                where: {
                    referenceCode,
                },
                include: {
                        documents: true,
                        organization: {
                            select: {
                                id: true,
                                legalName: true,
                            },
                        },
                        submittedBy: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                });

            if (!registration) {
                throw new NotFoundException(
                    'Registration request not found',
                );
            }

            if (registration.status !== 'PENDING') {
                throw new ConflictException(
                    'This registration request has already been reviewed',
                );
            }

            // Documents must exist and all must be clean
            if (
                registration.documents.length === 0 ||
                registration.documents.some(
                    (document) => document.scanStatus !== 'CLEAN',
                )
            ) {
                throw new ConflictException(
                    'Registration cannot be approved until all documents pass security scanning',
                );
            }

            // Prevent two admins from approving the same request concurrently
            const updatedRequest =
            await tx.registrationRequest.updateMany({
                where: {
                    id: registration.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'APPROVED',
                    reviewedById: reviewerId,
                    reviewedAt: new Date(),
                },
            });

            if (updatedRequest.count !== 1) {
                throw new ConflictException(
                    'This registration request has already been reviewed',
                );
            }

            // Activate organization
            await tx.organization.update({
                where: {
                    id: registration.organizationId,
                },
                data: {
                    status: 'ACTIVE',
                },
            });

            // Activate the organization admin
            await tx.user.update({
                where: {
                    id: registration.submittedById,
                },
                data: {
                    status: 'ACTIVE',
                },
            });

            return {
                message: 'Registration approved successfully',
                referenceCode,
                status: 'APPROVED',
                organizationId: registration.organizationId,
                organizationName: registration.organization.legalName,
                adminId: registration.submittedById,
                adminEmail: registration.submittedBy.email,
            };
        },
        {
            isolationLevel: 'Serializable',
        },
        );
        // ==========================================
        // 2. SEND EMAIL AFTER TRANSACTION
        // ==========================================

        let emailStatus: 'SENT' | 'FAILED' = 'SENT';
        try {
            await this.mailService.sendRegistrationApproved(
                result.adminEmail,
                result.organizationName,
            );
        } catch (error) {
            emailStatus = 'FAILED';

            this.logger.error(
                `Approval email failed for ${referenceCode}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
        // ==========================================
        // 3. RETURN RESPONSE
        // ==========================================
        return {
            message: 'Registration approved successfully',
            referenceCode: result.referenceCode,
            status: result.status,
            organizationId: result.organizationId,
            adminId: result.adminId,
            emailNotification: {
                status: emailStatus,
                message:
                    emailStatus === 'SENT'
                        ? 'Approval email accepted by the mail server'
                        : 'Registration was approved, but the email could not be sent',
            },
        };
    }

    // 4. Reject registration
    async reject(
        referenceCode: string,
        reviewerId: string,
        dto: RejectRegistrationDto,
    ) {
        // ==========================================
        // 1. DATABASE TRANSACTION
        // ==========================================
        const result = await this.prisma.$transaction(
            async (tx) => {
                const registration =
                    await tx.registrationRequest.findUnique({
                        where: {
                            referenceCode,
                        },
                        include: {
                            organization: {
                                select: {
                                    id: true,
                                    legalName: true,
                                },
                            },
                            submittedBy: {
                                select: {
                                    id: true,
                                    email: true,
                                },
                            },
                        },
                    });
                if (!registration) {
                    throw new NotFoundException(
                        'Registration request not found',
                    );
                }
                if (registration.status !== 'PENDING') {
                    throw new ConflictException(
                        'This registration request has already been reviewed',
                    );
                }
                // Prevent concurrent review
                const updatedRequest =
                    await tx.registrationRequest.updateMany({
                        where: {
                            id: registration.id,
                            status: 'PENDING',
                        },
                        data: {
                            status: 'REJECTED',
                            rejectionReason: dto.reason,
                            reviewedById: reviewerId,
                            reviewedAt: new Date(),
                        },
                    });
                if (updatedRequest.count !== 1) {
                    throw new ConflictException(
                        'This registration request has already been reviewed',
                    );
                }
                // Reject organization
                await tx.organization.update({
                    where: {
                        id: registration.organizationId,
                    },
                    data: {
                        status: 'REJECTED',
                    },
                });
                return {
                    referenceCode,
                    organizationId: registration.organizationId,
                    organizationName: registration.organization.legalName,
                    adminEmail: registration.submittedBy.email,
                    reason: dto.reason,
                };
            },
            {
                isolationLevel: 'Serializable',
            },
        );
        // ==========================================
        // 2. SEND REJECTION EMAIL
        // ==========================================
        let emailStatus: 'SENT' | 'FAILED' = 'SENT';
        try {
            await this.mailService.sendRegistrationRejected(
                result.adminEmail,
                result.organizationName,
                result.reason,
            );
        } catch (error) {
            emailStatus = 'FAILED';
            this.logger.error(
                `Rejection email failed for ${referenceCode}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
        // ==========================================
        // 3. RETURN RESPONSE
        // ==========================================
        return {
            message: 'Registration rejected successfully',
            referenceCode: result.referenceCode,
            status: 'REJECTED',
            reason: result.reason,
            emailNotification: {
                status: emailStatus,
                message:
                    emailStatus === 'SENT'
                        ? 'Rejection email accepted by the mail server'
                        : 'Registration was rejected, but the email could not be sent',
            },
        };
    }

    async getDocumentAccess(
        referenceCode: string,
        documentId: string,
        mode: 'view' | 'download',
        ) {
        // 1. Find registration request
        const registration =
            await this.prisma.registrationRequest.findUnique({
            where: {
                referenceCode,
            },
            select: {
                id: true,
                referenceCode: true,
            },
            });

        if (!registration) {
            throw new NotFoundException(
            'Registration request not found',
            );
        }

        // 2. Make sure the document belongs to this registration
        const document =
            await this.prisma.organizationDocument.findFirst({
            where: {
                id: documentId,
                registrationRequestId: registration.id,
            },
            select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                scanStatus: true,
                cloudinaryPublicId: true,
            },
            });

        if (!document) {
            throw new NotFoundException(
            'Verification document not found',
            );
        }

        // 3. Do not allow access to infected or failed documents
        if (
            document.scanStatus === 'INFECTED' ||
            document.scanStatus === 'FAILED'
        ) {
            throw new ConflictException(
            'This document is not available for access',
            );
        }

        // 4. Generate temporary Cloudinary URL
        const access = await this.documentsService
            .generateVerificationDocumentUrl(
            document.cloudinaryPublicId,
            mode,
            );

        // 5. Return safe response
        return {
            message: 'Document access URL generated successfully',
            document: {
            id: document.id,
            originalFileName: document.originalFileName,
            mimeType: document.mimeType,
            scanStatus: document.scanStatus,
            },
            access: {
            url: access.url,
            mode: access.mode,
            expiresAt: access.expiresAt,
            },
        };
    }
}