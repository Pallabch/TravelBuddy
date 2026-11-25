ALTER TABLE "trip_checklist_section" ADD COLUMN "kind" text DEFAULT 'group' NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_checklist_section" ADD COLUMN "owner_id" text;--> statement-breakpoint
-- Existing sections stay shared with the whole trip.
UPDATE "trip_checklist_section" SET "kind" = 'group' WHERE "kind" IS NULL OR "kind" = '';
