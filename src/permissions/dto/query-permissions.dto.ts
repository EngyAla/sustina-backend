import { Type } from 'class-transformer';

import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
    MaxLength,
    IsIn,
} from 'class-validator';

export class QueryPermissionsDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsIn(['ACTIVE', 'INACTIVE', 'ALL'])
    status?: 'ACTIVE' | 'INACTIVE' | 'ALL';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;
}