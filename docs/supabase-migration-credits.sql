-- =============================================================================
-- Tables CRÉDITS (emprunts / prêts + remboursements)
-- Aligné sur backend/src/entities/credit.entity.ts
-- =============================================================================

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('emprunt', 'pret_accorde')),
  intitule VARCHAR NOT NULL,
  preteur VARCHAR NOT NULL,
  "montantTotal" DECIMAL(15, 2) NOT NULL,
  "montantRembourse" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "tauxInteret" DECIMAL(15, 2),
  "dateDebut" DATE NOT NULL,
  "dateEcheance" DATE,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('en_cours', 'solde', 'en_retard')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS credit_remboursements (
  id UUID PRIMARY KEY,
  "creditId" UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  montant DECIMAL(15, 2) NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_credit_remboursements_credit ON credit_remboursements("creditId");
