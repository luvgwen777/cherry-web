const AUTH_KEY = "cherry_web_auth";
const CARD_KEY = "cherry_web_card_key";

// 示例卡密列表（在实际应用中应该在后端验证）
const VALID_CARD_KEYS = [
  "CHERRY-2024-ABC",
  "CHERRY-2024-XYZ",
  "CHERRY-2024-123",
  "CHERRY-WEB-2024",
  "DEMO-KEY-1234",
];

export interface AuthState {
  isAuthenticated: boolean;
  cardKey: string | null;
  expiresAt: number | null;
}

export function getAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) {
      return {
        isAuthenticated: false,
        cardKey: null,
        expiresAt: null,
      };
    }
    const auth: AuthState = JSON.parse(stored);
    // 检查是否过期（7天有效期）
    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      clearAuth();
      return {
        isAuthenticated: false,
        cardKey: null,
        expiresAt: null,
      };
    }
    return auth;
  } catch {
    return {
      isAuthenticated: false,
      cardKey: null,
      expiresAt: null,
    };
  }
}

export function setAuthState(cardKey: string) {
  const auth: AuthState = {
    isAuthenticated: true,
    cardKey,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后过期
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  localStorage.setItem(CARD_KEY, cardKey);
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CARD_KEY);
}

export function verifyCardKey(cardKey: string): boolean {
  if (!cardKey || cardKey.trim().length === 0) {
    return false;
  }
  const trimmedKey = cardKey.trim().toUpperCase();
  return VALID_CARD_KEYS.includes(trimmedKey);
}

export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated;
}
