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

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'prod' ? true : false,
  sameSite: 'lax' as 'lax' | 'strict' | 'none',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user as { id: number; email: string },
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

    // 클라이언트 리디렉션 또는 JSON 응답
    return res.redirect('/');
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

  //for test
  @Get('access-token/refresh')
  @UseGuards(JwtRefreshTokenGuard)
  async refresh1(@Req() req, @Res() res: Response) {
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
  async logout(@UserId() userId: number, @Res() res: Response) {
    await this.authService.clearRefreshToken(userId);
    res.clearCookie(cookieNames.accessTokenCookieName);
    res.clearCookie(cookieNames.refreshTokenCookieName);
    return res.send();
  }
}
