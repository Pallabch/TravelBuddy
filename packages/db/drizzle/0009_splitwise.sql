CREATE TABLE "trip_expense_share" (
	"expense_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"share_cents" integer NOT NULL,
	CONSTRAINT "trip_expense_share_expense_id_user_id_pk" PRIMARY KEY("expense_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "trip_settlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"from_user" text NOT NULL,
	"to_user" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "currency" text DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_expense" ADD COLUMN "category" text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_expense" ADD COLUMN "spent_on" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_expense" ADD COLUMN "split_type" text DEFAULT 'equal' NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_expense" ADD COLUMN "added_by" text;--> statement-breakpoint
ALTER TABLE "trip_expense_share" ADD CONSTRAINT "trip_expense_share_expense_id_trip_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."trip_expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_settlement" ADD CONSTRAINT "trip_settlement_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "trip_expense" SET "spent_on" = ("created_at" AT TIME ZONE 'UTC')::date;--> statement-breakpoint
INSERT INTO "trip_expense_share" ("expense_id", "user_id", "share_cents")
SELECT e.id, m.user_id,
  e.amount_cents / m.member_count + CASE WHEN m.position <= e.amount_cents % m.member_count THEN 1 ELSE 0 END
FROM "trip_expense" AS e
JOIN (
  SELECT trip_id, user_id,
    row_number() OVER (PARTITION BY trip_id ORDER BY user_id) AS position,
    count(*) OVER (PARTITION BY trip_id) AS member_count
  FROM "trip_member"
) AS m ON m.trip_id = e.trip_id;