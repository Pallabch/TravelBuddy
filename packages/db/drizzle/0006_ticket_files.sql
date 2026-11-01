ALTER TABLE "trip_ticket" DROP COLUMN "title";
--> statement-breakpoint
ALTER TABLE "trip_ticket" DROP COLUMN "kind";
--> statement-breakpoint
ALTER TABLE "trip_ticket" DROP COLUMN "reference";
--> statement-breakpoint
ALTER TABLE "trip_ticket" DROP COLUMN "details";
--> statement-breakpoint
ALTER TABLE "trip_ticket" ADD COLUMN "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_ticket" ADD COLUMN "object_key" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_ticket" ADD COLUMN "content_type" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "trip_ticket" ADD COLUMN "uploaded_by" text NOT NULL;
