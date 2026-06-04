-- Journal d'audit (Nest / TypeORM entity AuditLog). À exécuter sur Supabase si synchronize est désactivé.
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module varchar(50) NOT NULL,
  action varchar(20) NOT NULL,
  "entityId" varchar(128),
  "actorLogin" varchar(120),
  "actorRole" varchar(30),
  summary text,
  "beforeData" jsonb,
  "afterData" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
