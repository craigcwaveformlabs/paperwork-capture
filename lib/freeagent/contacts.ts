import { apiRequest } from './client';

type FreeAgentContact = { url: string; organisation_name?: string };

/**
 * Resolves a customer/supplier name to a FreeAgent contact URL, creating an
 * organisation contact if none matches. Cache is per-upload so repeated names
 * across rows only cost one lookup/create each.
 */
export async function findOrCreateContact(name: string, cache: Map<string, string>): Promise<string> {
  const key = name.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const { contacts = [] } = await apiRequest<{ contacts?: FreeAgentContact[] }>('/contacts?per_page=100');
  const existing = contacts.find((c) => (c.organisation_name ?? '').trim().toLowerCase() === key);
  if (existing) {
    cache.set(key, existing.url);
    return existing.url;
  }

  const { contact } = await apiRequest<{ contact: FreeAgentContact }>('/contacts', {
    method: 'POST',
    body: { contact: { organisation_name: name.trim() } },
  });
  cache.set(key, contact.url);
  return contact.url;
}
