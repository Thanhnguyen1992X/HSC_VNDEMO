/**
 * Authentication configuration
 */
export const authConfig = {
  jwt: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    tempTokenExpiry: "5m", // for 2FA flow
  },
  bcrypt: {
    saltRounds: 12,
  },
  resetTokenExpiry: 60 * 60 * 1000, // 1 hour in ms
};
