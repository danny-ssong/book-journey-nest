const accessTokenCookieName = 'access_token';
const refreshTokenCookieName = 'refresh_token';

export const cookieNames = {
  accessTokenCookieName,
  refreshTokenCookieName,
};

export const accessTokenMaxAgeMilliSeconds = 15 * 60 * 1000;
export const refreshTokenMaxAgeMilliSeconds = 12 * 30 * 24 * 60 * 1000;
