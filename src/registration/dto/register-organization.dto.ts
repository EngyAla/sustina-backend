import { Transform, Type } from 'class-transformer';

import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsString,
    Equals,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
    Matches,
    } from 'class-validator';

    export class RegisterOrganizationDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    legalName: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    hqCountry: string;

    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    firstReportingYear: number;

    @IsUUID()
    subIndustryId: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsString()
    @MinLength(12, { message: 'Password must be at least 12 characters long' })
    @MaxLength(128)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
        {
            message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        },
    )
    password: string;

    @IsString()
    @MinLength(12)
    @MaxLength(128)
    confirmPassword: string;

    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value; // سيتم رفضها تلقائياً لو كانت شيء آخر
    })
    @IsBoolean()
    @Equals(true, { message: 'You must accept the terms and conditions' })
    termsAccepted: boolean;

    // @Transform(({ value }) => value === true || value === 'true')
    // @IsBoolean()
    // @Equals(true)
    // authorityAttested: boolean;
}
