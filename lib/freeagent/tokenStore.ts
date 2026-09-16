import fs from 'fs';
import path from 'path';
import { config } from './config';

export type FreeAgentTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  obtained_at: number;
  [key: string]: unknown;
};

export type FreeAgentTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  [key: string]: unknown;
};

export function saveTokens(tokens: FreeAgentTokenResponse): FreeAgentTokens {
  const withTimestamp: FreeAgentTokens = { ...tokens, obtained_at: Date.now() };
  fs.mkdirSync(path.dirname(config.tokensFile), { recursive: true });
  fs.writeFileSync(config.tokensFile, JSON.stringify(withTimestamp, null, 2));
  return withTimestamp;
}

export function loadTokens(): FreeAgentTokens | null {
  if (!fs.existsSync(config.tokensFile)) return null;
  return JSON.parse(fs.readFileSync(config.tokensFile, 'utf8'));
}
