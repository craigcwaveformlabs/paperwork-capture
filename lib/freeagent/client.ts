import { config } from './config';
import { loadTokens, type FreeAgentTokens } from './tokenStore';
import { refreshTokens } from './auth';

let cached: FreeAgentTokens | null = null;

function isExpired(tokens: FreeAgentTokens): boolean {
  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  return ageSeconds >= tokens.expires_in - 60; // refresh a minute early
}

export function isConnected(): boolean {
  return !!(cached ?? loadTokens());
}

async function getAccessToken(): Promise<string> {
  if (!cached) cached = loadTokens();
  if (!cached) {
    throw new Error('Not connected to FreeAgent yet — visit /freeagent and connect your account.');
  }
  if (isExpired(cached)) {
    cached = await refreshTokens(cached.refresh_token);
  }
  return cached.access_token;
}

export async function apiRequest<T = unknown>(
  pathAndQuery: string,
  { method = 'GET', body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${config.apiBase}${pathAndQuery}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(`FreeAgent API ${method} ${pathAndQuery} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}
