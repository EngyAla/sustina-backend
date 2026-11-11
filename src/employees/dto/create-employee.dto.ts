import {
    IsArray,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsString,
    IsUUID,
    ArrayNotEmpty,
    ArrayUnique,
    MaxLength,
} from 'class-validator';

import { EmployeePermissionType } from '../../generated/prisma/client.js';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsUUID()
    departmentId: string;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsEnum(EmployeePermissionType, { each: true })
    permissions: EmployeePermissionType[];
}