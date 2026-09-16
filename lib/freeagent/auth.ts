import { config, assertConfigured } from './config';
import { saveTokens, type FreeAgentTokens } from './tokenStore';

async function exchange(body: Record<string, string>): Promise<FreeAgentTokens> {
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return saveTokens(await res.json());
}

export function exchangeCodeForTokens(code: string) {
  return exchange({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  });
}

export function refreshTokens(refreshToken: string) {
  return exchange({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

export function buildAuthorizeUrl(): string {
  assertConfigured();
  const url = new URL(config.authorizeUrl);
  url.searchParams.set('client_id', config.clientId!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  return url.toString();
}
