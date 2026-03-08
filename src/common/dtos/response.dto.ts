import { ApiProperty } from "@nestjs/swagger";

export class GeneralResponseDto<Data = {}> {
  @ApiProperty()
  code: number;
  @ApiProperty()
  message: string;
  @ApiProperty()
  data: Data[] | Data
}