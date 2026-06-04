ALTER TABLE caisse_transactions
ADD COLUMN IF NOT EXISTS utilisateur VARCHAR(120);
