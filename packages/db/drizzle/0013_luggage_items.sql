ALTER TABLE "trip_luggage_section" ADD COLUMN "luggage_id" uuid;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ADD COLUMN "luggage_id" uuid;
--> statement-breakpoint
UPDATE "trip_luggage_section" AS section
SET "luggage_id" = checklist."luggage_id"
FROM "trip_luggage_checklist" AS checklist
WHERE checklist."id" = section."checklist_id";
--> statement-breakpoint
UPDATE "trip_luggage_item" AS item
SET "luggage_id" = section."luggage_id"
FROM "trip_luggage_section" AS section
WHERE section."id" = item."section_id";
--> statement-breakpoint
DELETE FROM "trip_luggage_item" WHERE "luggage_id" IS NULL;
--> statement-breakpoint
DELETE FROM "trip_luggage_section" WHERE "luggage_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "trip_luggage_section" ALTER COLUMN "luggage_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ALTER COLUMN "luggage_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" DROP CONSTRAINT "trip_luggage_item_section_id_trip_luggage_section_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ALTER COLUMN "section_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ADD CONSTRAINT "trip_luggage_item_section_id_trip_luggage_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."trip_luggage_section"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trip_luggage_section" DROP CONSTRAINT "trip_luggage_section_checklist_id_trip_luggage_checklist_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_luggage_section" DROP COLUMN "checklist_id";
--> statement-breakpoint
ALTER TABLE "trip_luggage_section" ADD CONSTRAINT "trip_luggage_section_luggage_id_trip_luggage_id_fk" FOREIGN KEY ("luggage_id") REFERENCES "public"."trip_luggage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ADD CONSTRAINT "trip_luggage_item_luggage_id_trip_luggage_id_fk" FOREIGN KEY ("luggage_id") REFERENCES "public"."trip_luggage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP TABLE "trip_luggage_checklist";
