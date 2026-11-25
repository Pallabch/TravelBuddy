CREATE TABLE "trip_luggage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_luggage_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"luggage_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_luggage_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_luggage_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"label" text NOT NULL,
	"packed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_luggage" ADD CONSTRAINT "trip_luggage_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trip_luggage_checklist" ADD CONSTRAINT "trip_luggage_checklist_luggage_id_trip_luggage_id_fk" FOREIGN KEY ("luggage_id") REFERENCES "public"."trip_luggage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trip_luggage_section" ADD CONSTRAINT "trip_luggage_section_checklist_id_trip_luggage_checklist_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."trip_luggage_checklist"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trip_luggage_item" ADD CONSTRAINT "trip_luggage_item_section_id_trip_luggage_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."trip_luggage_section"("id") ON DELETE cascade ON UPDATE no action;
