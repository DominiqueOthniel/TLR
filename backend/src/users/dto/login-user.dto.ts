import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  login: string;

  @IsString()
  @MinLength(1)
  password: string;
}
