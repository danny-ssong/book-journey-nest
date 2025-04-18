import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { cookieNames } from 'src/common/const/const';
import { Request } from 'express';
import { JwtPayload } from '../jwt-payload.interface';
import { UsersService } from 'src/users/users.service';

export class JwtRefreshTokenGuard extends AuthGuard('jwt-refresh') {}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies[cookieNames.refreshTokenCookieName],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        envVariableKeys.refreshTokenSecret,
      )!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const userId = payload.sub;
    const refreshToken = req.cookies[cookieNames.refreshTokenCookieName];
    const user = await this.usersService.findUserWithRefreshToken(
      userId,
      refreshToken,
    );

    if (!user) {
      throw new UnauthorizedException(
        '해당 refresh token을 가지고 있는 유저가 없습니다.',
      );
    }

    return payload;
  }
}
