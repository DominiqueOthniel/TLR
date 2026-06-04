-- Index de performance (Supabase / PostgreSQL)
-- À exécuter une fois si DB_SYNCHRONIZE=false en production.

CREATE INDEX IF NOT EXISTS idx_trips_date_depart ON trips ("dateDepart");
CREATE INDEX IF NOT EXISTS idx_trips_chauffeur_id ON trips ("chauffeurId");
CREATE INDEX IF NOT EXISTS idx_trips_statut ON trips (statut);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses ("tripId");
CREATE INDEX IF NOT EXISTS idx_expenses_chauffeur_id ON expenses ("chauffeurId");
CREATE INDEX IF NOT EXISTS idx_expenses_camion_id ON expenses ("camionId");

CREATE INDEX IF NOT EXISTS idx_parcel_expeditions_date_depart ON parcel_expeditions ("dateDepart");
CREATE INDEX IF NOT EXISTS idx_parcel_expeditions_chauffeur_id ON parcel_expeditions ("chauffeurId");
CREATE INDEX IF NOT EXISTS idx_parcel_expeditions_statut ON parcel_expeditions (statut);

CREATE INDEX IF NOT EXISTS idx_driver_transactions_driver_id ON driver_transactions ("driverId");

CREATE INDEX IF NOT EXISTS idx_invoices_date_creation ON invoices ("dateCreation");
CREATE INDEX IF NOT EXISTS idx_invoices_statut ON invoices (statut);
CREATE INDEX IF NOT EXISTS idx_invoices_trajet_id ON invoices ("trajetId");
CREATE INDEX IF NOT EXISTS idx_invoices_parcel_expedition_id ON invoices ("parcelExpeditionId");

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs ("createdAt");
