const accessTokenCookieName = 'access_token';
const refreshTokenCookieName = 'refresh_token';

export const cookieNames = {
  accessTokenCookieName,
  refreshTokenCookieName,
};

export const accessTokenMaxAge = 5 * 60 * 1000;
export const refreshTokenMaxAge = 30 * 24 * 60 * 60 * 1000;
