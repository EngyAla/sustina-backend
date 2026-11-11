import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
    MaxLength,
    Matches,
    ArrayUnique,
} from 'class-validator';

import { EmployeePermissionType } from '../../generated/prisma/client.js';

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsEnum(EmployeePermissionType, { each: true })
    permissions?: EmployeePermissionType[];

    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(30)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Password must contain letters and numbers',
    })
    password?: string;
}