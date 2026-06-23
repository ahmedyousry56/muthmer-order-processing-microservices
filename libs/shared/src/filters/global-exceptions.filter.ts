import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nValidationException, I18nContext } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] | Record<string, string> =
      'Internal server error';
    let error: string | undefined;

    if (exception instanceof I18nValidationException) {
      const i18n = I18nContext.current();
      const errors: Record<string, string> = {};

      const extractErrors = (errs: any[], prefix = '') => {
        for (const err of errs) {
          let currentKey = err.property;
          if (prefix) {
            currentKey = !isNaN(Number(err.property))
              ? `${prefix}[${err.property}]`
              : `${prefix}.${err.property}`;
          }
          if (err.constraints) {
            for (const raw of Object.values(err.constraints)) {
              if (!raw || typeof raw !== 'string') continue;
              const [key, argsJson] = raw.split('|');
              let args: Record<string, unknown> = {
                property: err.property,
                value: err.value,
              };
              if (argsJson) {
                try {
                  args = {
                    ...args,
                    ...JSON.parse(argsJson),
                  };
                } catch {
                  /* ignore */
                }
              }
              if (!i18n) {
                errors[currentKey] = raw;
              } else {
                errors[currentKey] = i18n.t(key, {
                  lang: i18n.lang,
                  args,
                });
              }
              break; // Only take the first error per field
            }
          }
          if (err.children && err.children.length > 0) {
            extractErrors(err.children, currentKey);
          }
        }
      };

      extractErrors(exception.errors ?? []);
      message = errors;
      error = 'Unprocessable Entity';
      response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        error,
        message,
      });
      return;
    }

    if (isHttp) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const r = res as {
          message?: string | string[];
          error?: string;
        };
        message = r.message ?? exception.message;
        error = r.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      error,
      message,
    });
  }
}
