import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ArrayUnique,
    ArrayMinSize,
    ArrayContains,
} from 'class-validator';

import { Transform } from 'class-transformer';

import { EmployeePermissionType } from '../../generated/prisma/client.js';

export class CreatePermissionDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsEnum(EmployeePermissionType, { each: true })
    @ArrayContains([EmployeePermissionType.VIEW], {
        message: 'VIEW operation is required for every permission.',
    })
    operations!: EmployeePermissionType[];
}