import { AuthService } from './auth.service';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { TestBed } from '@automock/jest';
import { envVariableKeys } from 'src/common/const/env.const';
import {
  accessTokenMaxAgeMilliSeconds,
  refreshTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;
  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    authService = unit;
    jwtService = unitRef.get(JwtService);
    userService = unitRef.get(UsersService);
    configService = unitRef.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('issueAccessToken', () => {
    it('should issue access token', async () => {
      const user = { id: '1', email: 'test@test.com' };
      const payload = { sub: user.id, email: user.email };

      configService.get = jest.fn().mockReturnValue('accessTokenSecret');
      jwtService.signAsync = jest.fn().mockResolvedValue('accessToken');

      const token = await authService.issueAccessToken(user);

      expect(configService.get).toHaveBeenCalledWith(
        envVariableKeys.accessTokenSecret,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'accessTokenSecret',
        expiresIn: accessTokenMaxAgeMilliSeconds / 1000,
      });
      expect(token).toBe('accessToken');
    });
  });

  describe('issueRefreshToken', () => {
    it('should issue refresh token', async () => {
      const user = { id: '1', email: 'test@test.com' };
      const payload = { sub: user.id, email: user.email };

      configService.get = jest.fn().mockReturnValue('refreshTokenSecret');
      jwtService.signAsync = jest.fn().mockResolvedValue('refreshToken');

      const token = await authService.issueRefreshToken(user);

      expect(configService.get).toHaveBeenCalledWith(
        envVariableKeys.refreshTokenSecret,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'refreshTokenSecret',
        expiresIn: refreshTokenMaxAgeMilliSeconds / 1000,
      });
      expect(token).toBe('refreshToken');
    });
  });

  describe('validateOAuthLogin', () => {
    const thirdPartyId = '123';
    const email = 'test@test.com';
    const name = 'test';
    const user = { id: '1', email, name } as User;

    it('should return user, not called createWithProfile if user exists', async () => {
      userService.findUserByThirdPartyId = jest.fn().mockResolvedValue(user);

      const result = await authService.validateOAuthLogin(
        thirdPartyId,
        email,
        name,
      );

      expect(userService.findUserByThirdPartyId).toHaveBeenCalledWith(
        thirdPartyId,
      );
      expect(userService.createWithProfile).not.toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should return user, after create new user if user not exists ', async () => {
      userService.findUserByThirdPartyId = jest.fn().mockResolvedValue(null);
      userService.createWithProfile = jest.fn().mockResolvedValue(user);

      const result = await authService.validateOAuthLogin(
        thirdPartyId,
        email,
        name,
      );

      expect(userService.findUserByThirdPartyId).toHaveBeenCalledWith(
        thirdPartyId,
      );
      expect(userService.createWithProfile).toHaveBeenCalledWith({
        thirdPartyId,
        email,
        name,
      });
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should return accessToken and refreshToken', async () => {
      const user = { id: '1', name: 'test', email: 'test@test.com' } as User;

      authService.issueAccessToken = jest.fn().mockResolvedValue('accessToken');
      authService.issueRefreshToken = jest
        .fn()
        .mockResolvedValue('refreshToken');

      const result = await authService.login(user);
      expect(authService.issueAccessToken).toHaveBeenCalledWith(user);
      expect(authService.issueRefreshToken).toHaveBeenCalledWith(user);
      expect(userService.saveRefreshToken).toHaveBeenCalledWith(
        user.id,
        'refreshToken',
      );
      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });
  });

  describe('clearRefreshToken', () => {
    it('should clear refresh token', async () => {
      const userId = '1';
      await authService.clearRefreshToken(userId);
      expect(userService.clearRefreshToken).toHaveBeenCalledWith(userId);
    });
  });
});
