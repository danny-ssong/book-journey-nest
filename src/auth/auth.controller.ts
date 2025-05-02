import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './strategy/google.strategy';
import { JwtRefreshTokenGuard } from './strategy/jwt-refresh.strategy';
import {
  accessTokenMaxAge,
  cookieNames,
  refreshTokenMaxAge,
} from 'src/common/const/const';
import { Response } from 'express';
import { Public } from './decorator/public.decorator';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'prod' ? true : false,
  sameSite: 'lax' as 'lax' | 'strict' | 'none',
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
      maxAge: accessTokenMaxAge,
    });
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAge,
    });

    return res.redirect(
      this.configService.get<string>(envVariableKeys.frontendUrl)!,
    );
  }

  @Post('access-token/refresh')
  @Public()
  @UseGuards(JwtRefreshTokenGuard)
  async refresh(@Req() req, @Res() res: Response) {
    const accessToken = await this.authService.issueAccessToken({
      id: req.user.sub,
      email: req.user.email,
    });
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge,
    });

    return res.send();
  }

  @Post('logout')
  async logout(@UserId() userId: string, @Res() res: Response) {
    await this.authService.clearRefreshToken(userId);
    res.clearCookie(cookieNames.accessTokenCookieName);
    res.clearCookie(cookieNames.refreshTokenCookieName);
    return res.send();
  }
}
