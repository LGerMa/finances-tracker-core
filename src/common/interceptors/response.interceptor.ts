import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export interface Response<T> {
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        return { code: 0, message: 'ok', data };
      }),
      catchError((e) => {
        let response;
        if (e instanceof HttpException) {
          response = e.getResponse();
        }
        if (
          response &&
          response.statusCode &&
          response.message &&
          Array.isArray(response.message)
        ) {
          return throwError(
            () =>
              new BadRequestException({
                code: 0,
                message: response.message.join(', '),
                data: {},
              }),
          );
        }
        return throwError(() => e);
      }),
    );
  }
}
