import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { createHash, randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class DocumentsService {
    constructor(private readonly configService: ConfigService) {
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

        const detectedType = await fileTypeFromBuffer(file.buffer);

        if (detectedType?.mime !== 'application/pdf') {
            throw new BadRequestException(
                'Only valid PDF documents are allowed',
            );
        }

        const sha256 = createHash('sha256')
        .update(file.buffer)
        .digest('hex');

        const publicId = `${randomUUID()}.pdf`;;

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
}