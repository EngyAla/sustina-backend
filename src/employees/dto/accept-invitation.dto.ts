import {
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator.js';


export class AcceptInvitationDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;

    @IsString()
    @IsNotEmpty()
    @Match('password', {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}
