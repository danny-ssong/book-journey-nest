import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
