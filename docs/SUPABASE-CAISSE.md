# Caisse dans Supabase

## Tables ajoutées

| Table | Rôle |
|--------|------|
| **`caisse_config`** | Solde initial (une ligne `id = 1`), équivalent de `localStorage` `caisse_solde_initial`. |
| **`caisse_transactions`** | Tous les mouvements (entrée / sortie), alignés sur `CaisseTransaction` dans `src/lib/caisse-local.ts`. |

Colonnes notables :

- `reference` : ex. `facture:<uuid>`, `depense:<uuid>`
- `exclutRevenu` : dons (hors revenu d’activité)
- `compteBanqueId` / `bankTransactionId` : lien prélèvement banque → caisse (FK vers tables existantes)

## Fichiers SQL

- **`backend/supabase-schema.sql`** : schéma complet incluant caisse (sections 10–11).
- **`docs/supabase-migration-caisse.sql`** : à exécuter seul sur une base qui a déjà le reste des tables.

## Après la migration

Les **INSERT SQL de dépenses** peuvent alimenter `expenses` dans Supabase, mais **l’app web** lit/écrit encore la caisse en **localStorage** tant que le code n’est pas branché sur l’API Supabase. Pour que la caisse suive la base :

1. Exposer des endpoints (ou utiliser le client Supabase) pour `caisse_config` et `caisse_transactions`.
2. Remplacer les appels dans `caisse-local.ts` / `Caisse.tsx` par des requêtes réseau + cache optionnel.

## Comportement de l’app (`VITE_API_URL`)

Si **`VITE_API_URL`** pointe vers ton backend Nest (ex. `https://xxx` ou `https://xxx/api`), la **caisse** et les **crédits** sont lus/écrits via l’API (donc Supabase côté serveur). Le front **ajoute `/api`** à l’URL si elle ne se termine pas déjà par `/api` (évite l’erreur Express « Cannot GET /caisse/config »). Sinon, l’app continue d’utiliser **localStorage** pour la caisse et les crédits (démo hors ligne).

- **Banque** : la page Banque utilise encore le localStorage ; le schéma SQL existe pour une migration future.

### Erreur « Cannot GET /api/caisse/transactions » sur Koyeb / production

Le backend répond, mais cette **version déployée** n’inclut pas les routes caisse (build ancien). **Redéploie** le service backend depuis le dernier commit, puis teste dans le navigateur :  
`https://TON-BACKEND.koyeb.app/api/caisse/transactions` → doit renvoyer du JSON (`[]`), pas une page HTML 404.

## Tables crédits (Supabase)

- `credits` + `credit_remboursements` : voir `backend/supabase-schema.sql` (section 12) ou `docs/supabase-migration-credits.sql`.
