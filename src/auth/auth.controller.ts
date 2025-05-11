import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './strategy/google.strategy';
import { JwtRefreshTokenGuard } from './strategy/jwt-refresh.strategy';
import {
  accessTokenMaxAgeMilliSeconds,
  cookieNames,
  refreshTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';
import { Response } from 'express';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import * as dotenv from 'dotenv';
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
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
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

  @Post('access-token/refresh')
  @UseGuards(JwtRefreshTokenGuard)
  @ApiOperation({ summary: 'Access Token 갱신' })
  @ApiResponse({
    status: 200,
    description: 'Access Token 갱신 성공',
  })
  async refresh(@Req() req, @Res() res: Response) {
    const accessToken = await this.authService.issueAccessToken({
      id: req.user.sub,
      email: req.user.email,
    });
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAgeMilliSeconds,
    });

    return res.send();
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@UserId() userId: string, @Res() res: Response) {
    await this.authService.clearRefreshToken(userId);
    res.clearCookie(cookieNames.accessTokenCookieName);
    res.clearCookie(cookieNames.refreshTokenCookieName);
    return res.send();
  }
}
