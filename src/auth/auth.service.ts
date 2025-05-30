import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  accessTokenMaxAgeMilliSeconds,
  refreshTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';
import { envVariableKeys } from 'src/common/const/env.const';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async issueAccessToken(user: { id: string; email: string }) {
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return await this.jwtService.signAsync(payload, {
      secret: accessTokenSecret,
      expiresIn: accessTokenMaxAgeMilliSeconds / 1000,
    });
  }

  async issueRefreshToken(user: { id: string; email: string }) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    return await this.jwtService.signAsync(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenMaxAgeMilliSeconds / 1000,
    });
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

  async login(user: { id: string; email: string }) {
    const accessToken = await this.issueAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user);

    await this.usersService.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async clearRefreshToken(userId: string) {
    await this.usersService.clearRefreshToken(userId);
  }
}
