CREATE TABLE "trip_checklist_tick" (
	"trip_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	CONSTRAINT "trip_checklist_tick_trip_id_user_id_item_id_pk" PRIMARY KEY("trip_id","user_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "trip_checklist_tick" ADD CONSTRAINT "trip_checklist_tick_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;