import fs from 'fs';
import path from 'path';

// Tiny .env loader — avoids taking on a dependency for a few key=value lines.
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const environment = process.env.FREEAGENT_ENV === 'production' ? 'production' : 'sandbox';
const host = environment === 'production' ? 'https://api.freeagent.com' : 'https://api.sandbox.freeagent.com';

export const config = {
  environment,
  apiBase: `${host}/v2`,
  authorizeUrl: `${host}/v2/approve_app`,
  tokenUrl: `${host}/v2/token_endpoint`,
  clientId: process.env.FREEAGENT_CLIENT_ID,
  clientSecret: process.env.FREEAGENT_CLIENT_SECRET,
  redirectUri: process.env.FREEAGENT_REDIRECT_URI || 'http://localhost:8090/callback',
  tokensFile: path.resolve(process.cwd(), 'tokens.json'),
};

export function assertConfigured() {
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'Missing FreeAgent app credentials. Copy .env.example to .env and set ' +
      'FREEAGENT_CLIENT_ID / FREEAGENT_CLIENT_SECRET from your Developer Dashboard app.'
    );
  }
}
