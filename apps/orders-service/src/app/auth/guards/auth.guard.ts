import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      const i18n = I18nContext.current(context);
      const message = i18n
        ? i18n.t('auth.unauthorized')
        : 'User is not authenticated';
      throw new UnauthorizedException(message);
    }
    return true;
  }
}
