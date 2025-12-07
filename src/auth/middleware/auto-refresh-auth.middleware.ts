import { NestMiddleware, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import {
  cookieNames,
  accessTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';
import { envVariableKeys } from 'src/common/const/env.const';
import { AuthService } from '../auth.service';
import { cookieOptions } from '../auth.controller';

@Injectable()
export class AutoRefreshAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies[cookieNames.accessTokenCookieName];
    const refreshToken = req.cookies[cookieNames.refreshTokenCookieName];

    // 토큰이 둘 다 없으면 인증하지 않은 사용자로 처리
    if (!accessToken && !refreshToken) {
      return next();
    }

    // Access token이 유효한지 먼저 확인
    if (accessToken) {
      try {
        const payload = await this.jwtService.verifyAsync(accessToken, {
          secret: this.configService.get<string>(
            envVariableKeys.accessTokenSecret,
          ),
        });

        // 유효하면 req.user에 추가하고 다음으로
        req.user = payload;
        return next();
      } catch (error) {
        // Access token 만료 또는 유효하지 않음 -> Refresh token으로 갱신 시도
        console.log('Access token invalid, attempting refresh...');
      }
    }

    // 2. Refresh token으로 갱신 시도
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: this.configService.get<string>(
            envVariableKeys.refreshTokenSecret,
          ),
        });

        // 새로운 access token 발급
        const newAccessToken = await this.authService.issueAccessToken({
          id: payload.sub,
          email: payload.email,
        });

        // 쿠키에 새로운 access token 저장
        res.cookie('access_token', newAccessToken, {
          ...cookieOptions,
          maxAge: accessTokenMaxAgeMilliSeconds,
        });

        // req.user에 추가
        req.user = payload;

        console.log('Access token refreshed successfully');
        return next();
      } catch (error) {
        // Refresh token도 만료됨 - 쿠키 클리어
        res.clearCookie(cookieNames.accessTokenCookieName, cookieOptions);
        res.clearCookie(cookieNames.refreshTokenCookieName, cookieOptions);

        // 로그인이 필요한 요청이라면 Guard에서 처리
        return next();
      }
    }

    next();
  }
}
