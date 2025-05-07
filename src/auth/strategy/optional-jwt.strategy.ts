import { Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { cookieNames } from 'src/common/const/const';
import { Request } from 'express';
import { JwtPayload } from '../jwt-payload.interface';

export class OptionalJwtAuthGuard extends AuthGuard('jwt-optional') {
  handleRequest(err: any, user: any, info: any) {
    return user;
  }
}

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-optional',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies[cookieNames.accessTokenCookieName],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        envVariableKeys.accessTokenSecret,
      )!,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
