export type FetchLike = (i: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export async function fetchSafe(f: FetchLike, i: RequestInfo | URL, init: RequestInit = {}) {
  return f(i, { ...init, headers: { ...(init.headers || {}) } });
}
