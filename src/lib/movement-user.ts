/**
 * Affichage de la traçabilité utilisateur sur les mouvements caisse / banque.
 */
export function formatMovementUserLabel(t: { creePar?: string; modifiePar?: string }): string {
  const c = (t.creePar || '').trim();
  const m = (t.modifiePar || '').trim();
  if (!c && !m) return '—';
  if (c && m && m !== c) return `${c} (modif. ${m})`;
  return c || m;
}
