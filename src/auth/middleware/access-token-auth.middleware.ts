import { NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { cookieNames } from 'src/common/const/const';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class AccessTokenAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies[cookieNames.accessTokenCookieName];
    const refreshToken = req.cookies[cookieNames.refreshTokenCookieName];
    if (!accessToken && !refreshToken) return next();

    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get<string>(
          envVariableKeys.accessTokenSecret,
        ),
      });

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
