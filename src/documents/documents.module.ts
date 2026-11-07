import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { MalwareScannerModule } from '../malware-scanner/malware-scanner.module.js';

@Module({
    imports: [
      MalwareScannerModule,
    ],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
