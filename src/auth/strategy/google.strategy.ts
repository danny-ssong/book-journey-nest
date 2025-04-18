import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { envVariableKeys } from 'src/common/const/env.const';
import { AuthService } from '../auth.service';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>(envVariableKeys.googleClientId),
      clientSecret: configService.get<string>(
        envVariableKeys.googleClientSecret,
      ),
      callbackURL: configService.get<string>(envVariableKeys.googleCallbackUrl),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { id, name, emails } = profile;
    const user = await this.authService.validateOAuthLogin(
      id,
      emails[0].value,
      name.givenName,
    );
    done(null, user);
  }
}
