import { Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { cookieNames } from 'src/common/const/const';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.cookies[cookieNames.accessTokenCookieName],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        envVariableKeys.accessTokenSecret,
      )!,
    });
  }

  validate(payload: any) {
    return payload;
  }
}
