import { HttpException, HttpStatus } from '@nestjs/common';
import { responseAdapter } from '../adapters/response.adapter';

export class CustomException extends HttpException {
  constructor(
    internal_code: number,
    message: string,
    data: any,
    http_code: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(responseAdapter(internal_code, message, data), http_code);
  }
}
