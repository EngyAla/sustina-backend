import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    UnprocessableEntityException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { createHash, randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';

import {
    MalwareScannerService,
    MalwareScanStatus,
} from '../malware-scanner/malware-scanner.service.js';


@Injectable()
export class DocumentsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly malwareScannerService: MalwareScannerService,
    ) {
        cloudinary.config({
        cloud_name: this.configService.get<string>(
            'CLOUDINARY_CLOUD_NAME',
        ),
        api_key: this.configService.get<string>(
            'CLOUDINARY_API_KEY',
        ),
        api_secret: this.configService.get<string>(
            'CLOUDINARY_API_SECRET',
        ),
        secure: true,
        });
    }

    async uploadVerificationDocument(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException(
                'Verification document is required',
            );
        }

        // 1. Validate actual file signature
        const detectedType = await fileTypeFromBuffer(file.buffer);

        if (detectedType?.mime !== 'application/pdf') {
            throw new BadRequestException(
                'Only valid PDF documents are allowed',
            );
        }

        // 2. Calculate SHA-256
        const sha256 = createHash('sha256')
            .update(file.buffer)
            .digest('hex');

        // 3. Scan the file before uploading it to Cloudinary
        const scanStatus: MalwareScanStatus =
            await this.malwareScannerService.scanBuffer(file.buffer);

        if (scanStatus === 'INFECTED') {
            throw new UnprocessableEntityException(
            'The uploaded document was rejected because malware was detected',
            );
        }

        // 4. Upload only CLEAN documents
        const publicId = `${randomUUID()}.pdf`;

        try {
        const uploadedFile = await new Promise<{
            public_id: string;
            secure_url: string;
            bytes: number;
        }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'sustina/organization-verification',
                public_id: publicId,
                resource_type: 'raw',
                type: 'authenticated',
            },
            (error, result) => {
                if (error || !result) {
                reject(
                    error ?? new Error('Cloudinary upload failed'),
                );
                return;
                }

                resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                bytes: result.bytes,
                });
            },
            );

            uploadStream.end(file.buffer);
        });

        return {
            originalFileName: file.originalname,
            mimeType: detectedType.mime,
            sizeBytes: uploadedFile.bytes,
            cloudinaryPublicId: uploadedFile.public_id,
            secureUrl: uploadedFile.secure_url,
            sha256,
            scanStatus,
        };
        } catch {
            throw new InternalServerErrorException(
                'Failed to upload verification document',
            );
        }
    }

    async deleteVerificationDocument(publicId: string) {
        try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw',
            type: 'authenticated',
        });
        } catch (error) {
        console.error(
            'Failed to delete Cloudinary document:',
            error,
        );
        }
    }

    async generateVerificationDocumentUrl(
        publicId: string,
        mode: 'view' | 'download',
        ) {
        try {
            // Link expires after 5 minutes
            const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

            const url = cloudinary.utils.private_download_url(
            publicId,
            'pdf',
            {
                resource_type: 'raw',
                type: 'authenticated',
                expires_at: expiresAt,
                attachment: mode === 'download',
            },
            );

            return {
            url,
            mode,
            expiresAt: new Date(expiresAt * 1000).toISOString(),
            };
        } catch {
            throw new InternalServerErrorException(
            'Failed to generate verification document access URL',
            );
        }
    }
}