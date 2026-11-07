import { Transform, Type } from 'class-transformer';

import {
    IsIn,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

export class RegistrationQueryDto {
    @IsOptional()
    @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';

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