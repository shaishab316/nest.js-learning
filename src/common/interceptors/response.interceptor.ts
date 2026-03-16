/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { statusCode } = context.switchToHttp().getResponse();

    return next
      .handle()
      .pipe(map((data) => this.buildResponse(data, statusCode as number)));
  }

  private buildResponse(data: any, statusCode: number) {
    if (data?.meta) {
      return {
        success: true,
        statusCode,
        message: data.message ?? 'Success',
        data: data.data,
        meta: data.meta,
      };
    }

    if (data?.message) {
      return {
        success: true,
        statusCode,
        message: data.message,
        data: data.data ?? null,
      };
    }

    return { success: true, statusCode, message: 'Success', data };
  }
}
