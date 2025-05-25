import { Response } from 'express';
import { AuthController, cookieOptions } from './auth.controller';
import { AuthService } from './auth.service';
import { TestBed } from '@automock/jest';
import {
  accessTokenMaxAgeMilliSeconds,
  cookieNames,
  refreshTokenMaxAgeMilliSeconds,
} from 'src/common/const/const';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;
  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthController).compile();

    authController = unit;
    authService = unitRef.get(AuthService);
    configService = unitRef.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('googleAuth', () => {
    it('should be defined', () => {
      expect(authController.googleAuth()).toBeDefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call authService.login, send accessToken and refreshToken in cookies, and redirect to /', async () => {
      const mockReq = { user: { id: 1, email: 'test@test.com' } };
      const mockRes = {
        cookie: jest.fn().mockReturnThis(),
        redirect: jest.fn(),
      };

      const frontendUrl = 'http://localhost:3001';

      authService.login = jest.fn().mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      configService.get = jest.fn().mockReturnValue(frontendUrl);

      await authController.googleAuthRedirect(
        mockReq,
        mockRes as unknown as Response,
      );

      expect(authService.login).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'accessToken',
        {
          ...cookieOptions,
          maxAge: accessTokenMaxAgeMilliSeconds,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refreshToken',
        {
          ...cookieOptions,
          maxAge: refreshTokenMaxAgeMilliSeconds,
        },
      );

      expect(configService.get).toHaveBeenCalledWith(
        envVariableKeys.frontendUrl,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(frontendUrl);
    });
  });

  describe('refresh', () => {
    it('should call authService.issueAccessToken and return res accessToken in cookies', async () => {
      const mockReq = { user: { sub: 1, email: 'test@test.com' } };
      const mockRes = {
        cookie: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      jest
        .spyOn(authService, 'issueAccessToken')
        .mockResolvedValue('accessToken');

      await authController.refresh(mockReq, mockRes as unknown as Response);

      expect(authService.issueAccessToken).toHaveBeenCalledWith({
        id: mockReq.user.sub,
        email: mockReq.user.email,
      });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'accessToken',
        {
          ...cookieOptions,
          maxAge: accessTokenMaxAgeMilliSeconds,
        },
      );

      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call authService.clearRefreshToken and clear cookies', async () => {
      const userId = '1';
      const mockRes = {
        clearCookie: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      authService.clearRefreshToken = jest.fn().mockResolvedValue(undefined);
      await authController.logout(userId, mockRes as unknown as Response);
      expect(authService.clearRefreshToken).toHaveBeenCalledWith(userId);
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(
        1,
        cookieNames.accessTokenCookieName,
        cookieOptions,
      );
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(
        2,
        cookieNames.refreshTokenCookieName,
        cookieOptions,
      );
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
