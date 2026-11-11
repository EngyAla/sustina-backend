import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { UserStatus } from '../../generated/prisma/client.js';

export class QueryEmployeesDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 10;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value.trim())
    search?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}