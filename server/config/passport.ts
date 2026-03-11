import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  findUserByGoogleId,
  findUserByEmail,
  createUser,
  updateUser,
  saveRefreshToken,
} from "../services/userStorage.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

if (CLIENT_ID && CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const displayName = profile.displayName || profile.name?.givenName || "User";

          let user = await findUserByGoogleId(googleId);
          if (user) {
            return done(null, user);
          }

          if (email) {
            user = await findUserByEmail(email);
            if (user) {
              await updateUser(user.id, { googleId });
              return done(null, user);
            }
          }

          const username = (email?.split("@")[0] || displayName.replace(/\s/g, "")).slice(0, 80);
          const uniqueUsername = await ensureUniqueUsername(username);
          user = await createUser({
            username: uniqueUsername,
            email: email || `${googleId}@google.oauth`,
            googleId,
            isEmailVerified: !!email,
          });
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

async function ensureUniqueUsername(base: string): Promise<string> {
  const { findUserByUsername } = await import("../services/userStorage.js");
  let name = base;
  let suffix = 0;
  while (await findUserByUsername(name)) {
    name = `${base}${++suffix}`;
  }
  return name;
}
