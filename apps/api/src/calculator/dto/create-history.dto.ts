import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  deviceId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  expression!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  result!: string;
}
