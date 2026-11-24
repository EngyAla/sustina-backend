import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
} from 'class-validator';

export class CreateDataEntryDto {
    @IsUUID()
    dataItemId: string;

    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(\d{4}(-\d{2}|-Q[1-4])?)$/,
        {
        message: 'periodKey must be YYYY, YYYY-MM, or YYYY-Q1 to YYYY-Q4',
        },
    )
    periodKey: string;

    @IsString()
    @IsNotEmpty()
    @Matches(
        /^-?\d{1,14}(\.\d{1,6})?$/,
        {
        message: 'value must be a valid number with up to 6 decimal places',
        },
    )
    value: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notes?: string;

    @IsOptional()
    @IsUUID()
    dataCollectorId?: string;
}