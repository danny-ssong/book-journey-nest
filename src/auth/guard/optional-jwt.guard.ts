import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { cookieNames } from 'src/common/const/const';
import { envVariableKeys } from 'src/common/const/env.const';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies[cookieNames.accessTokenCookieName];
    if (!token) {
      req.user = undefined;
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>(
          envVariableKeys.accessTokenSecret,
        )!,
      });
      req.user = payload;
    } catch {
      req.user = undefined;
    }
    return true;
  }
}
