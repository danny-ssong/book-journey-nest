import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { OptionalJwtStrategy } from './strategy/optional-jwt.strategy';

@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    OptionalJwtStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
