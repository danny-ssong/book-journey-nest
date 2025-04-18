import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { accessTokenMaxAge, refreshTokenMaxAge } from 'src/common/const/const';
import { envVariableKeys } from 'src/common/const/env.const';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async issueAccessToken(user: { id: number; email: string }) {
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: accessTokenSecret,
        expiresIn: accessTokenMaxAge,
      },
    );
  }

  async issueRefreshToken(user: { id: number; email: string }) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      { secret: refreshTokenSecret, expiresIn: refreshTokenMaxAge },
    );
  }

  async validateOAuthLogin(thirdPartyId: string, email: string, name: string) {
    let user = await this.usersService.findUserByThirdPartyId(thirdPartyId);

    if (!user) {
      user = await this.usersService.createWithProfile({
        thirdPartyId,
        email,
        name,
      });
    }
    return user;
  }

  async login(user: { id: number; email: string }) {
    const accessToken = await this.issueAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user);
    return { accessToken, refreshToken };
  }
}
