import {
    IsIn,
    IsOptional,
    IsUUID,
    Matches,
} from 'class-validator';

export class QueryDataEntriesDto {
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @IsOptional()
    @IsUUID()
    dataItemId?: string;

    @IsOptional()
    @Matches(/^(\d{4}(-\d{2}|-Q[1-4])?)$/)
    periodKey?: string;

    @IsOptional()
    @IsIn(['DRAFT', 'SUBMITTED'])
    status?: 'DRAFT' | 'SUBMITTED';
}