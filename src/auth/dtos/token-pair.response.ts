import { ApiProperty } from '@nestjs/swagger';
import { ITokenPair } from '../interfaces/auth.interface';

export class TokenPairResponse implements ITokenPair {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
