import { IsOptional, IsString, Length } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @Length(6, 6)
  joinCode!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  clientName?: string;
}
