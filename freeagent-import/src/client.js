import { config } from './config.js';
import { loadTokens, refreshTokens } from './auth.js';

let cached = loadTokens();

function isExpired(tokens) {
  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  return ageSeconds >= tokens.expires_in - 60; // refresh a minute early
}

async function getAccessToken() {
  if (!cached) cached = loadTokens();
  if (!cached) {
    throw new Error('No saved tokens found — run `npm run authorize` first.');
  }
  if (isExpired(cached)) {
    cached = await refreshTokens(cached.refresh_token);
  }
  return cached.access_token;
}

export async function apiRequest(pathAndQuery, { method = 'GET', body } = {}) {
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
  return data;
}
