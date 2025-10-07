// Minimal API types used by packages/sdk during typechecking.
// Keep these small and permissive; they are placeholders to get the
// workspace typecheckable. Replace with full types during a focused
// API typings cleanup.

export type LoginRequest = { email: string; password: string };
export type LoginResponse = {
  id?: string;
  tokens?: { accessToken: string; refreshToken: string };
  user?: any;
};
export type RefreshTokenRequest = { refreshToken: string };
export type RefreshTokenResponse = { tokens?: { accessToken: string; refreshToken: string } };
export type LogoutRequest = any;
export type MeResponse = any;
export type SessionsResponse = any;

export type PaginationResponse = {
  cursor?: string | null;
  limit?: number;
  total?: number;
};

export type PaginationResponseApi = PaginationResponse;

export function apiTypesAvailable() {
  return true;
}
