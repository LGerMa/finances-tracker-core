import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  // URLs to exclude from logging
  private readonly excludedUrls: string[] = [
    '/api/health',
    // Add more URLs to exclude as needed`
  ];

  // Fields to mask (sensitive information)
  private readonly sensitiveFields: string[] = [
    // Add more fields to mask as needed
  ];

  private shouldSkipLogging(url: string): boolean {
    return this.excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }

  private maskSensitiveData(data: any): any {
    if (!data) {
      return data;
    }

    // For arrays, process each item
    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    // For objects, process recursively
    if (typeof data === 'object') {
      const maskedData = { ...data };

      Object.keys(maskedData).forEach((key) => {
        if (this.sensitiveFields.includes(key.toLowerCase())) {
          maskedData[key] = '***';
        } else if (
          typeof maskedData[key] === 'object' &&
          maskedData[key] !== null
        ) {
          maskedData[key] = this.maskSensitiveData(maskedData[key]);
        }
      });

      return maskedData;
    }

    return data;
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query } = request;

    // Check if the URL should be excluded from logging
    if (this.shouldSkipLogging(url)) {
      return next.handle();
    }

    // Clone and mask sensitive data in the body
    const maskedBody = this.maskSensitiveData(body);
    const maskedQuery = this.maskSensitiveData(query);

    // Capture start time
    const startTime = Date.now();

    // Build request log info
    const requestLogInfo = {
      ...(Object.keys(maskedQuery || {}).length > 0 && { query: maskedQuery }),
      ...(maskedBody &&
        Object.keys(maskedBody).length > 0 && { body: maskedBody }),
    };

    return next.handle().pipe(
      tap(() => {
        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Log success request
        this.logger.log(
          `[${method} ${url}] SUCCESS | Response Time: ${responseTime}ms | Details: ${JSON.stringify(
            requestLogInfo,
          )}`,
        );
      }),
      catchError((error) => {
        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Log error request with error details
        this.logger.error(
          `[${method} ${url}] ERROR | Response Time: ${responseTime}ms | Status: ${
            error.status || 'Unknown'
          } | Message: ${error.message} | Details: ${JSON.stringify(
            requestLogInfo,
          )}`,
          error.stack,
        );

        // Re-throw the error so it continues through the error handling pipeline
        return throwError(() => error);
      }),
    );
  }
}
