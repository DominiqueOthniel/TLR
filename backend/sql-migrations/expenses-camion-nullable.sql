-- Base déjà créée : autoriser les dépenses sans camion (aligné entity + DTO).
ALTER TABLE expenses ALTER COLUMN "camionId" DROP NOT NULL;
