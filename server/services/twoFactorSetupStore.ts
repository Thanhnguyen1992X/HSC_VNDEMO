/**
 * In-memory store for 2FA setup secrets (valid 5 min)
 */
const store = new Map<string, { secret: string; expiresAt: number }>();
const TTL = 5 * 60 * 1000;

export function setTwoFactorSetupSecret(userId: string, secret: string): void {
  store.set(userId, { secret, expiresAt: Date.now() + TTL });
}

export function getTwoFactorSetupSecret(userId: string): string | null {
  const entry = store.get(userId);
  if (!entry || entry.expiresAt < Date.now()) {
    store.delete(userId);
    return null;
  }
  store.delete(userId);
  return entry.secret;
}
