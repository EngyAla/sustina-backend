import { Module } from '@nestjs/common';

import { MailService } from './mail.service.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [
        AuthModule,
        DocumentsModule,
        MailModule,
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}