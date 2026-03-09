import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from 'src/modules/auth/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload & { id: string } => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: JwtPayload & { id: string } }>();
    return request.user;
  },
);
