/**
 * Caisse : localStorage (hors ligne / démo) ou API Nest + Supabase si VITE_API_URL est défini.
 */

import { caisseApi, type CaisseTransactionPayload } from '@/lib/api';

export const CAISSE_STORAGE_KEY = 'caisse_transactions';

export interface CaisseTransaction {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  description: string;
  utilisateur?: string;
  categorie?: string;
  reference?: string;
  compteBanqueId?: string;
  bankTransactionId?: string;
  exclutRevenu?: boolean;
}

export const CAISSE_SOLDE_INSUFFISANT_MESSAGE =
  'Solde caisse insuffisant : opération annulée pour éviter un solde négatif.';

export type CaisseValidationResult =
  | { ok: true; soldeProjeté: number }
  | { ok: false; message: string; soldeDisponible: number; soldeProjeté: number };

function parseNum(val: unknown): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
}

/** True si le front doit persister la caisse via l’API (backend → Supabase). */
export function isRemoteCaisse(): boolean {
  return Boolean(import.meta.env.VITE_API_URL?.trim());
}

let _txCache: CaisseTransaction[] = [];
let _soldeInitialCache = 0;

function loadLocalStorageTxs(): CaisseTransaction[] {
  try {
    const s = localStorage.getItem(CAISSE_STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function normalizeCaisseTx(r: Record<string, unknown>): CaisseTransaction {
  return {
    id: String(r.id),
    type: r.type as 'entree' | 'sortie',
    montant: parseNum(r.montant),
    date: String(r.date).split('T')[0],
    description: String(r.description),
    utilisateur: r.utilisateur ? String(r.utilisateur) : undefined,
    categorie: r.categorie ? String(r.categorie) : undefined,
    reference: r.reference ? String(r.reference) : undefined,
    compteBanqueId: r.compteBanqueId ? String(r.compteBanqueId) : undefined,
    bankTransactionId: r.bankTransactionId ? String(r.bankTransactionId) : undefined,
    exclutRevenu: Boolean(r.exclutRevenu),
  };
}

/** Recharge le cache depuis l’API (à appeler au démarrage et après chaque mutation). */
export async function refreshCaisseFromApi(): Promise<void> {
  if (!isRemoteCaisse()) return;
  const [cfg, txs] = await Promise.all([caisseApi.getConfig(), caisseApi.getTransactions()]);
  _soldeInitialCache = cfg.soldeInitial;
  _txCache = Array.isArray(txs) ? txs.map((t) => normalizeCaisseTx(t as Record<string, unknown>)) : [];
}

export function getCaisseTransactions(): CaisseTransaction[] {
  if (isRemoteCaisse()) return [..._txCache];
  return loadLocalStorageTxs();
}

export function setCaisseTransactions(transactions: CaisseTransaction[]): void {
  if (isRemoteCaisse()) {
    console.warn(
      '[caisse] setCaisseTransactions ignoré en mode API — les écritures passent par caisseApi',
    );
    return;
  }
  localStorage.setItem(CAISSE_STORAGE_KEY, JSON.stringify(transactions));
}

export function getCaisseSoldeInitialSync(): number {
  if (isRemoteCaisse()) return _soldeInitialCache;
  return parseFloat(localStorage.getItem('caisse_solde_initial') || '0') || 0;
}

export function calculateCaisseSolde(
  transactions: CaisseTransaction[] = getCaisseTransactions(),
  soldeInitial = getCaisseSoldeInitialSync(),
): number {
  return transactions.reduce(
    (sum, t) => sum + (t.type === 'entree' ? t.montant : -t.montant),
    soldeInitial,
  );
}

function caisseTxEffect(tx: Pick<CaisseTransaction, 'type' | 'montant'>): number {
  return tx.type === 'entree' ? tx.montant : -tx.montant;
}

export function validateCaisseTransaction(
  tx: Pick<CaisseTransaction, 'id' | 'type' | 'montant' | 'reference'>,
  options: {
    existingId?: string;
    existingReference?: string;
    transactions?: CaisseTransaction[];
    soldeInitial?: number;
  } = {},
): CaisseValidationResult {
  const transactions = options.transactions ?? getCaisseTransactions();
  const soldeInitial = options.soldeInitial ?? getCaisseSoldeInitialSync();
  if (!Number.isFinite(tx.montant) || tx.montant <= 0) {
    return {
      ok: false,
      message: 'Le montant doit être un nombre positif.',
      soldeDisponible: calculateCaisseSolde(transactions, soldeInitial),
      soldeProjeté: calculateCaisseSolde(transactions, soldeInitial),
    };
  }
  const remaining = transactions.filter((current) => {
    if (options.existingId && current.id === options.existingId) return false;
    if (options.existingReference && current.reference === options.existingReference) return false;
    return true;
  });
  const soldeDisponible = calculateCaisseSolde(remaining, soldeInitial);
  const soldeProjeté = soldeDisponible + caisseTxEffect(tx);

  if (soldeProjeté < 0) {
    return {
      ok: false,
      message: `${CAISSE_SOLDE_INSUFFISANT_MESSAGE} Disponible : ${soldeDisponible.toLocaleString('fr-FR')} FCFA.`,
      soldeDisponible,
      soldeProjeté,
    };
  }

  return { ok: true, soldeProjeté };
}

export function validateCaisseSoldeInitial(
  nextSoldeInitial: number,
  transactions: CaisseTransaction[] = getCaisseTransactions(),
): CaisseValidationResult {
  const soldeProjeté = calculateCaisseSolde(transactions, nextSoldeInitial);
  if (soldeProjeté < 0) {
    return {
      ok: false,
      message: `${CAISSE_SOLDE_INSUFFISANT_MESSAGE} Le solde initial est trop bas pour les sorties déjà enregistrées.`,
      soldeDisponible: calculateCaisseSolde(transactions, getCaisseSoldeInitialSync()),
      soldeProjeté,
    };
  }
  return { ok: true, soldeProjeté };
}

export async function persistCaisseSoldeInitial(value: number): Promise<void> {
  if (isRemoteCaisse()) await refreshCaisseFromApi();
  const check = validateCaisseSoldeInitial(value);
  if (check.ok === false) throw new Error(check.message);
  if (isRemoteCaisse()) {
    await caisseApi.updateConfig({ soldeInitial: value });
    await refreshCaisseFromApi();
  } else {
    localStorage.setItem('caisse_solde_initial', String(value));
  }
}

/** Entrée explicitement exclue des encaissements d'activité. */
export function isFinancementEntree(t: CaisseTransaction): boolean {
  return t.type === 'entree' && t.exclutRevenu === true;
}

/** @deprecated utiliser isFinancementEntree */
export function isDonRecu(t: CaisseTransaction): boolean {
  return isFinancementEntree(t);
}

function payloadFromTx(t: CaisseTransaction): CaisseTransactionPayload {
  return {
    id: t.id,
    type: t.type,
    montant: t.montant,
    date: t.date,
    description: t.description,
    utilisateur: t.utilisateur,
    categorie: t.categorie,
    reference: t.reference,
    compteBanqueId: t.compteBanqueId,
    bankTransactionId: t.bankTransactionId,
    exclutRevenu: Boolean(t.exclutRevenu),
  };
}

/**
 * Paiement facture (hors virement) → entrée de caisse.
 */
export async function appendEntreeFromInvoicePayment(params: {
  montant: number;
  date: string;
  factureNumero: string;
  factureId: string;
  modeLibelle?: string;
}): Promise<void> {
  if (params.montant <= 0) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const tx: CaisseTransaction = {
    id,
    type: 'entree',
    montant: params.montant,
    date: params.date,
    description: `Encaissement facture ${params.factureNumero}${params.modeLibelle ? ` (${params.modeLibelle})` : ''}`,
    reference: `facture:${params.factureId}`,
    categorie: 'Encaissements clients',
  };
  if (isRemoteCaisse()) {
    await caisseApi.createTransaction(payloadFromTx(tx));
    await refreshCaisseFromApi();
  } else {
    setCaisseTransactions([...getCaisseTransactions(), tx]);
  }
}

/**
 * Paiement facture fournisseur (hors virement) → sortie de caisse.
 */
export async function appendSortieFromExpenseInvoicePayment(params: {
  montant: number;
  date: string;
  factureNumero: string;
  factureId: string;
  modeLibelle?: string;
}): Promise<void> {
  if (params.montant <= 0) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const tx: CaisseTransaction = {
    id,
    type: 'sortie',
    montant: params.montant,
    date: params.date,
    description: `Paiement facture fournisseur ${params.factureNumero}${params.modeLibelle ? ` (${params.modeLibelle})` : ''}`,
    reference: `facture:${params.factureId}`,
    categorie: 'Factures fournisseurs',
  };
  if (isRemoteCaisse()) await refreshCaisseFromApi();
  const check = validateCaisseTransaction(tx);
  if (check.ok === false) throw new Error(check.message);
  if (isRemoteCaisse()) {
    await caisseApi.createTransaction(payloadFromTx(tx));
    await refreshCaisseFromApi();
  } else {
    setCaisseTransactions([...getCaisseTransactions(), tx]);
  }
}

export function isPaiementVersBanque(mode: string | undefined): boolean {
  if (!mode) return false;
  return mode.trim().toLowerCase().includes('virement');
}

/** @deprecated utiliser !isPaiementVersBanque */
export function isModeEncaissementCaisse(mode: string | undefined): boolean {
  if (!mode) return true;
  return !isPaiementVersBanque(mode);
}

const REF_DEPENSE_PREFIX = 'depense:';

export async function upsertSortieFromExpense(expense: {
  id: string;
  montant: number;
  date: string;
  description: string;
  categorie: string;
}): Promise<void> {
  if (!Number.isFinite(expense.montant) || expense.montant <= 0) return;
  const ref = `${REF_DEPENSE_PREFIX}${expense.id}`;
  const dateStr = expense.date.includes('T') ? expense.date.split('T')[0] : expense.date;
  const tx: CaisseTransaction = {
    id: `caisse-dep-${expense.id}`,
    type: 'sortie',
    montant: expense.montant,
    date: dateStr,
    description: `Dépense : ${expense.description}`,
    reference: ref,
    categorie: expense.categorie || 'Dépenses',
  };
  if (isRemoteCaisse()) await refreshCaisseFromApi();
  const check = validateCaisseTransaction(tx, { existingReference: ref });
  if (check.ok === false) throw new Error(check.message);
  if (isRemoteCaisse()) {
    await caisseApi.upsertByReference(ref, payloadFromTx(tx));
    await refreshCaisseFromApi();
  } else {
    const txs = getCaisseTransactions().filter((t) => t.reference !== ref);
    setCaisseTransactions([...txs, tx]);
  }
}

export async function removeCaisseLienDepense(expenseId: string): Promise<void> {
  const ref = `${REF_DEPENSE_PREFIX}${expenseId}`;
  if (isRemoteCaisse()) {
    await caisseApi.removeByReference(ref);
    await refreshCaisseFromApi();
  } else {
    setCaisseTransactions(getCaisseTransactions().filter((t) => t.reference !== ref));
  }
}

/** Création / mise à jour d’une ligne (mode API). */
export async function saveCaisseTransactionRemote(tx: CaisseTransaction, isNew: boolean): Promise<void> {
  if (!isRemoteCaisse()) return;
  await refreshCaisseFromApi();
  const check = validateCaisseTransaction(tx, isNew ? undefined : { existingId: tx.id });
  if (check.ok === false) throw new Error(check.message);
  if (isNew) {
    await caisseApi.createTransaction(payloadFromTx(tx));
  } else {
    await caisseApi.updateTransaction(tx.id, payloadFromTx(tx));
  }
  await refreshCaisseFromApi();
}

export async function deleteCaisseTransactionRemote(id: string): Promise<void> {
  if (!isRemoteCaisse()) return;
  await caisseApi.deleteTransaction(id);
  await refreshCaisseFromApi();
}
