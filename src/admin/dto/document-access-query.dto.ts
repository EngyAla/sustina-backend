import { IsIn, IsOptional } from 'class-validator';

export class DocumentAccessQueryDto {
    @IsOptional()
    @IsIn(['view', 'download'])
    mode: 'view' | 'download' = 'view';
}