import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DataEntriesController } from './data-entries.controller.js';
import { DataEntriesService } from './data-entries.service.js';



@Module({
    imports: [
        DocumentsModule,
        AuthModule,
    ],
    controllers: [
        DataEntriesController,
    ],
    providers: [
        DataEntriesService,
    ],
})
export class DataEntriesModule {}
