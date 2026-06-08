import { createHash } from 'crypto';

/** Hash SHA-256 (aligné sur le frontend historique). */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}
