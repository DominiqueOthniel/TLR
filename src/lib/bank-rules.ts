/**
 * Règles métier communes pour les mouvements bancaires (front + alignement avec le backend).
 *
 * Crédits (augmentent le solde) : dépôt, virement entrant sur ce compte
 * Débits (diminuent le solde) : retrait, prélèvement, frais
 */
export const BANK_CREDIT_TYPES = ['depot', 'virement'] as const;
export type BankCreditType = (typeof BANK_CREDIT_TYPES)[number];

export const BANK_DEBIT_TYPES = ['retrait', 'prelevement', 'frais'] as const;
export type BankDebitType = (typeof BANK_DEBIT_TYPES)[number];

export function isBankCreditType(type: string): boolean {
  return type === 'depot' || type === 'virement';
}

export function isBankDebitType(type: string): boolean {
  return type === 'retrait' || type === 'prelevement' || type === 'frais';
}

/** Effet algébrique sur le solde (+ crédit, - débit). */
export function transactionDeltaOnBalance(type: string, montant: number): number {
  const m = Number(montant);
  if (!Number.isFinite(m) || m < 0) return 0;
  return isBankCreditType(type) ? m : -m;
}
