CREATE TABLE "trip_itinerary_participant" (
	"itinerary_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "trip_itinerary_participant_itinerary_id_user_id_pk" PRIMARY KEY("itinerary_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "trip_itinerary" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "trip_itinerary" ADD COLUMN "location" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_itinerary" ADD COLUMN "added_by" text;--> statement-breakpoint
ALTER TABLE "trip_itinerary_participant" ADD CONSTRAINT "trip_itinerary_participant_itinerary_id_trip_itinerary_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."trip_itinerary"("id") ON DELETE cascade ON UPDATE no action;