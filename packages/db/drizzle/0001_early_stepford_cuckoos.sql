CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"home_city" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"languages" text DEFAULT '' NOT NULL,
	"travel_style" text DEFAULT '' NOT NULL,
	"avatar_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
