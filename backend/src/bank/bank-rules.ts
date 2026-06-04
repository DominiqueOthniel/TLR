/** Même logique que le front (src/lib/bank-rules.ts) : dépôt + virement = crédit ; reste = débit. */
export function isBankCreditType(type: string): boolean {
  return type === 'depot' || type === 'virement';
}

export function isBankDebitType(type: string): boolean {
  return type === 'retrait' || type === 'prelevement' || type === 'frais';
}

export function transactionDeltaOnBalance(type: string, montant: number): number {
  const m = Number(montant);
  if (!Number.isFinite(m) || m < 0) return 0;
  return isBankCreditType(type) ? m : -m;
}
