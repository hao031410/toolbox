import { IsOptional, IsString, Length } from 'class-validator';

export class PostMessageDto {
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @IsString()
  @Length(1, 32)
  type!: string;

  @IsOptional()
  payload?: unknown;
}
