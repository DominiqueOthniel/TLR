# Insérer des mouvements bancaires dans Supabase

Le schéma Postgres est déjà décrit dans `backend/supabase-schema.sql` (`bank_accounts`, `bank_transactions`). Les colonnes utilisent des **guillemets** pour le camelCase (`"compteId"`, `"soldeActuel"`, etc.), comme TypeORM / Nest.

## 1. Prérequis

- Projet Supabase avec la base créée (ou tables `bank_accounts` / `bank_transactions` présentes).
- Un **compte** existant : récupère son `id` (UUID) dans **Table Editor** → `bank_accounts`.

Types de mouvement autorisés : `depot`, `retrait`, `virement`, `prelevement`, `frais`.

**Règle de solde** (identique à l’app) :

- **Crédit** (augmente le solde) : `depot`, `virement`
- **Débit** : `retrait`, `prelevement`, `frais`

---

## 2. Insertion directe — SQL (éditeur SQL Supabase)

```sql
-- Remplace les UUID par les tiens
INSERT INTO bank_transactions (
  id,
  "compteId",
  type,
  montant,
  date,
  description,
  reference,
  categorie
) VALUES (
  gen_random_uuid(),
  'TON-UUID-COMPTE-BANCAIRE'::uuid,
  'depot',
  150000.00,
  CURRENT_DATE,
  'Dépôt espèces agence',
  'DEP-2025-001',
  'Opérations courantes'
);
```

Puis **mettre à jour le solde du compte** (si tu n’as pas le trigger ci-dessous) :

```sql
UPDATE bank_accounts ba
SET "soldeActuel" = (
  SELECT ba."soldeInitial" + COALESCE(SUM(
    CASE
      WHEN bt.type IN ('depot', 'virement') THEN bt.montant
      ELSE -bt.montant
    END
  ), 0)
  FROM bank_transactions bt
  WHERE bt."compteId" = ba.id
)
WHERE ba.id = 'TON-UUID-COMPTE-BANCAIRE'::uuid;
```

---

## 3. Fonction + trigger (recommandé) — recalcul auto du solde

À exécuter **une fois** dans l’éditeur SQL Supabase :

```sql
CREATE OR REPLACE FUNCTION public.recalculate_bank_solde(p_compte_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s_init numeric;
  s numeric;
BEGIN
  SELECT "soldeInitial" INTO s_init FROM bank_accounts WHERE id = p_compte_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT s_init + COALESCE(SUM(
    CASE
      WHEN type IN ('depot', 'virement') THEN montant
      ELSE -montant
    END
  ), 0)
  INTO s
  FROM bank_transactions
  WHERE "compteId" = p_compte_id;

  UPDATE bank_accounts
  SET "soldeActuel" = s
  WHERE id = p_compte_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_bank_tx_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_bank_solde(OLD."compteId");
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM recalculate_bank_solde(NEW."compteId");
    IF OLD."compteId" IS DISTINCT FROM NEW."compteId" THEN
      PERFORM recalculate_bank_solde(OLD."compteId");
    END IF;
    RETURN NEW;
  ELSE
    PERFORM recalculate_bank_solde(NEW."compteId");
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS bank_transactions_recalc ON bank_transactions;

CREATE TRIGGER bank_transactions_recalc
AFTER INSERT OR UPDATE OR DELETE ON bank_transactions
FOR EACH ROW
EXECUTE FUNCTION public.trg_bank_tx_recalc();
```

> Sur certaines versions Postgres, remplace `EXECUTE FUNCTION` par `EXECUTE PROCEDURE` si l’erreur l’indique.

Après ça, un simple `INSERT` dans `bank_transactions` met à jour `"soldeActuel"` tout seul.

---

## 4. Client JavaScript / TypeScript (`@supabase/supabase-js`)

Installation :

```bash
npm install @supabase/supabase-js
```

Exemple (front **admin** ou script Node avec **service role** — ne jamais exposer la service key côté navigateur public) :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ou anon + RLS adaptée
);

export async function ajouterMouvementBanque(params: {
  compteId: string;
  type: 'depot' | 'retrait' | 'virement' | 'prelevement' | 'frais';
  montant: number;
  date: string; // 'YYYY-MM-DD'
  description: string;
  reference?: string;
  categorie?: string;
}) {
  const { data, error } = await supabase
    .from('bank_transactions')
    .insert({
      id: crypto.randomUUID(),
      compteId: params.compteId, // Supabase JS mappe vers "compteId" si besoin
      type: params.type,
      montant: params.montant,
      date: params.date,
      description: params.description,
      reference: params.reference ?? null,
      categorie: params.categorie ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Attention** : les noms de colonnes en base sont entre guillemets (`"compteId"`). Le client Supabase envoie souvent des clés en **camelCase** ; si l’insert échoue, utilise explicitement :

```typescript
.insert({
  id: crypto.randomUUID(),
  compteId: params.compteId,
  ...
})
```

Si la table attend exactement `"compteId"`, en REST l’API Supabase accepte en général `compteId` dans le JSON. Sinon, passe par **RPC** ou requête SQL brute :

```typescript
const { error } = await supabase.rpc('insert_bank_transaction', { ... });
```

Ou :

```typescript
await supabase.from('bank_transactions').insert([
  {
    id: crypto.randomUUID(),
    compteId: params.compteId,
    type: params.type,
    montant: params.montant,
    date: params.date,
    description: params.description,
  },
]);
```

---

## 5. Row Level Security (RLS)

Si RLS est activé sur `bank_transactions`, ajoute des politiques (ex. lecture/écriture pour `authenticated` ou pour un rôle service). Pour des scripts serveur, la **service role** contourne RLS — à utiliser uniquement côté backend sécurisé.

---

## 6. Lien avec l’app React actuelle

Aujourd’hui la page **Banque** lit `localStorage` (`bank_accounts`, `bank_transactions`). Les insertions dans **Supabase seules** ne s’affichent pas dans l’UI tant que tu ne synchronises pas (API Nest + `DATABASE_URL` Supabase, ou nouveau module front branché sur Supabase).

Le backend Nest (`BankModule`) peut utiliser la même base : si `DATABASE_URL` pointe vers Supabase Postgres, les mouvements créés via l’API sont dans les mêmes tables.

---

## Résumé

| Méthode | Usage |
|--------|--------|
| SQL dans le dashboard | Tests, imports, corrections ponctuelles |
| Trigger `recalculate_bank_solde` | Solde toujours cohérent après INSERT/UPDATE/DELETE |
| `supabase-js` | Scripts, Edge Functions, backend Node |
| API Nest existante | Même schéma, logique métier déjà dans `BankService` |
