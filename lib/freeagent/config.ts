import path from 'path';

const environment = process.env.FREEAGENT_ENV === 'production' ? 'production' : 'sandbox';
const host = environment === 'production' ? 'https://api.freeagent.com' : 'https://api.sandbox.freeagent.com';

export const config = {
  environment,
  apiBase: `${host}/v2`,
  authorizeUrl: `${host}/v2/approve_app`,
  tokenUrl: `${host}/v2/token_endpoint`,
  clientId: process.env.FREEAGENT_CLIENT_ID,
  clientSecret: process.env.FREEAGENT_CLIENT_SECRET,
  redirectUri: process.env.FREEAGENT_REDIRECT_URI || 'http://localhost:3000/api/oauth/callback',
  tokensFile: path.resolve(process.cwd(), 'data', 'freeagent-tokens.json'),
};

export function assertConfigured() {
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'Missing FreeAgent app credentials. Copy .env.local.example to .env.local and set ' +
        'FREEAGENT_CLIENT_ID / FREEAGENT_CLIENT_SECRET from your Developer Dashboard app.',
    );
  }
}
