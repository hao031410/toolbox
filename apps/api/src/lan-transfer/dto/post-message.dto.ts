import { Allow, IsOptional, IsString, Length } from 'class-validator';

export class PostMessageDto {
  @IsString()
  @Length(1, 64)
  clientId!: string;

  @IsString()
  @Length(1, 32)
  type!: string;

  // WebRTC 信令内容是动态对象，必须显式放行，否则会被全局 whitelist 清掉。
  @Allow()
  @IsOptional()
  payload?: unknown;
}
