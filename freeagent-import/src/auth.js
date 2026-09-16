import http from 'http';
import fs from 'fs';
import { config, assertConfigured } from './config.js';

function saveTokens(tokens) {
  const withTimestamp = { ...tokens, obtained_at: Date.now() };
  fs.writeFileSync(config.tokensFile, JSON.stringify(withTimestamp, null, 2));
  return withTimestamp;
}

export function loadTokens() {
  if (!fs.existsSync(config.tokensFile)) return null;
  return JSON.parse(fs.readFileSync(config.tokensFile, 'utf8'));
}

async function exchange(body) {
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

export function exchangeCodeForTokens(code) {
  return exchange({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  });
}

export function refreshTokens(refreshToken) {
  return exchange({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

// Full handshake: print the approve_app URL, capture the redirect on a local
// HTTP server, exchange the code, save tokens.json. Run once via `npm run authorize`.
export async function runAuthorizationFlow() {
  assertConfigured();
  const redirect = new URL(config.redirectUri);

  const codePromise = new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== redirect.pathname) {
        res.writeHead(404).end();
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        error
          ? `<h1>Authorization failed</h1><p>${error}</p>`
          : '<h1>Authorized</h1><p>You can close this tab and return to the terminal.</p>'
      );
      server.close();
      error ? reject(new Error(error)) : resolve(code);
    });
    server.listen(Number(redirect.port) || 80);
  });

  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);

  console.log(`\nEnvironment: ${config.environment}`);
  console.log('Open this URL in a browser and approve access:\n');
  console.log(authorizeUrl.toString());
  console.log(`\nWaiting for the redirect to ${config.redirectUri} ...\n`);

  const code = await codePromise;
  await exchangeCodeForTokens(code);
  console.log('Authorized — tokens saved to tokens.json.');
}
