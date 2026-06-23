import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService, AppConfigService } from '@libs/shared';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly JwtService: JwtService,
    private readonly PrismaService: PrismaService,
    private readonly AppConfigService: AppConfigService,
  ) {}

  async use(req: RequestWithUser, _res: Response, next: NextFunction) {
    const token = this.extractToken(req);

    if (token) {
      const user = await this.resolveUser(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  }

  private extractToken(req: RequestWithUser): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return req.cookies?.[this.AppConfigService.jwt.cookieName] ?? null;
  }

  private async resolveUser(token: string) {
    try {
      const payload = this.JwtService.verify<{ sub: string; email: string }>(
        token,
        {
          secret: this.AppConfigService.jwt.secret,
        },
      );

      if (!payload?.sub) return null;

      return await this.PrismaService.customers.findUnique({
        where: { id: payload.sub },
      });
    } catch {
      return null;
    }
  }
}
