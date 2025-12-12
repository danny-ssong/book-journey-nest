import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private readonly sensitiveFields = [
    'password',
    'accessToken',
    'refreshToken',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query } = request;
    const now = Date.now();

    const sanitizedBody = this.sanitizeBody(body);
    this.logger.log(
      `[Request] ${method} | ${url} | Body: ${JSON.stringify(sanitizedBody)} | Query: ${JSON.stringify(query)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const time = Date.now() - now;
          this.logger.verbose(`[Response] ${method} | ${url} | ${time}ms`);
        },
        error: (error) => {
          const time = Date.now() - now;
          this.logger.error(
            `[Error] ${method} | ${url} | ${time}ms | ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  // 민감 정보 제거 함수
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    for (const field of this.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }

    const jsonStr = JSON.stringify(sanitized);
    if (jsonStr.length > 1000) {
      return { _summary: `Large payload (${jsonStr.length} bytes)` };
    }

    return sanitized;
  }
}
