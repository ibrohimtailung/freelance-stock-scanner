import { createHash } from 'crypto';

/**
 * SHA-256 hash of a URL.
 * Used as a stable, unique key for job deduplication
 * in both Redis (hot path) and PostgreSQL (persistent).
 */
export function hashUrl(url: string): string {
  return createHash('sha256')
    .update(url.trim().toLowerCase())
    .digest('hex');
}
