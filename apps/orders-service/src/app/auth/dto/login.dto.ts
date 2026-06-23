import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '../../../i18n/i18n-types';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'ahmedyousry098@gmail.com',
    description: 'User email',
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'validation.property_is_string',
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'validation.property_required',
    ),
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>(
        'validation.property_not_email',
      ),
    },
  )
  email!: string;

  @ApiProperty({
    example: 'SecurePassword@123',
    description: 'User password',
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>(
      'validation.property_is_string',
    ),
  })
  @MinLength(8, {
    message: i18nValidationMessage<I18nTranslations>(
      'validation.property_min_length',
      {
        args: { length: 8 },
      },
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'validation.property_required',
    ),
  })
  password!: string;
}
