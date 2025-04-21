import { AuthController, cookieOptions } from './auth.controller';
import { AuthService } from './auth.service';
import { TestBed } from '@automock/jest';
import { accessTokenMaxAge, refreshTokenMaxAge } from 'src/common/const/const';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthController).compile();

    authController = unit;
    authService = unitRef.get(AuthService);

    jest.clearAllMocks();
  });

  describe('googleAuth', () => {
    it('should be defined', () => {
      expect(authController.googleAuth()).toBeDefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call authService.login and return res accessToken and refreshToken in cookies', async () => {
      const mockReq = { user: { id: 1, email: 'test@test.com' } };
      const mockRes = {
        cookie: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
      };

      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      await authController.googleAuthRedirect(mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'accessToken',
        {
          ...cookieOptions,
          maxAge: accessTokenMaxAge,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refreshToken',
        {
          ...cookieOptions,
          maxAge: refreshTokenMaxAge,
        },
      );
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });
  });
});
