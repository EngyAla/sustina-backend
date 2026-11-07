import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class ResetPasswordDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, {
        message: 'OTP must contain exactly 6 digits',
    })
    otp!: string;

    @IsString()
    @MinLength(12)
    @MaxLength(128)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
        {
        message:
            'Password must contain uppercase, lowercase, number and special character',
        },
    )
    newPassword!: string;
}