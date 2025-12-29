-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingFrequency') THEN
    CREATE TYPE "BillingFrequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "recurring_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "billing_frequency" "BillingFrequency",
  ADD COLUMN IF NOT EXISTS "nextBillingDate" TIMESTAMP(3);

-- Ensure data integrity: when recurring is disabled, clear related fields
CREATE OR REPLACE FUNCTION sync_recurring_fields()
RETURNS trigger AS $$
BEGIN
  IF NEW."recurring_enabled" = FALSE THEN
    NEW."billing_frequency" := NULL;
    NEW."nextBillingDate" := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_recurring_sync ON "Client";
CREATE TRIGGER client_recurring_sync
BEFORE INSERT OR UPDATE ON "Client"
FOR EACH ROW EXECUTE FUNCTION sync_recurring_fields();
