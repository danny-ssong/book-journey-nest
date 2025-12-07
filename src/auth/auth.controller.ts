import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './strategy/google.strategy';
import {
  accessTokenMaxAgeMilliSeconds,
  cookieNames,
  refreshTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';
import { Response } from 'express';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import * as dotenv from 'dotenv';
import { Public } from './decorator/public.decorator';
dotenv.config();

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.ENV === 'prod' ? true : false,
  sameSite:
    process.env.ENV === 'prod' ? 'none' : ('lax' as 'lax' | 'strict' | 'none'),
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user as { id: string; email: string },
    );

    // 쿠키에 토큰 저장
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAgeMilliSeconds,
    });
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAgeMilliSeconds,
    });

    return res.redirect(
      this.configService.get<string>(envVariableKeys.frontendUrl)!,
    );
  }

  @Post('logout')
  @Public()
  logout(@Res() res: Response) {
    res.clearCookie(cookieNames.accessTokenCookieName, cookieOptions);
    res.clearCookie(cookieNames.refreshTokenCookieName, cookieOptions);
    return res.send();
  }
}
