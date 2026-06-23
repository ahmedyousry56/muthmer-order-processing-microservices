import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the operation was successful',
  })
  success!: boolean;

  @ApiPropertyOptional({
    example: 'Operation completed successfully',
    description: 'Optional success message',
  })
  message?: string;
}
