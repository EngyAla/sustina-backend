import {
    BadRequestException,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { RegistrationService } from './registration.service.js';
import { RegisterOrganizationDto } from './dto/register-organization.dto.js';

@Controller('registration')
export class RegistrationController {
    constructor(
        private readonly registrationService: RegistrationService,
    ) {}

    @Post('organizations')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileInterceptor('verificationDocument', {
        limits: {
            fileSize: 25 * 1024 * 1024,
        },
        fileFilter: (_request, file, callback) => {
            const isPdf =
            file.mimetype === 'application/pdf' &&
            file.originalname.toLowerCase().endsWith('.pdf');

            if (!isPdf) {
            callback(
                new BadRequestException('Only PDF files are allowed'),
                false,
            );
            return;
            }

            callback(null, true);
        },
        }),
    )
    async registerOrganization(
        @Body() dto: RegisterOrganizationDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
        throw new BadRequestException(
            'Verification document is required',
        );
        }

        return this.registrationService.registerOrganization(
        dto,
        file,
        );
    }
}
