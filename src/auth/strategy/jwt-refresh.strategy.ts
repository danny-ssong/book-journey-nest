import { Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { cookieNames } from 'src/common/const/const';
import { Request } from 'express';

export class JwtRefreshTokenGuard extends AuthGuard('jwt-refresh') {}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies[cookieNames.refreshTokenCookieName],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        envVariableKeys.refreshTokenSecret,
      )!,
    });
  }

  validate(payload: any) {
    return payload;
  }
}
