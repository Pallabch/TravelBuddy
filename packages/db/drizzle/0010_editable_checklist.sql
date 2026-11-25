CREATE TABLE "trip_checklist_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"label" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_checklist_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "checklist_updated_by" text;--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "checklist_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "trip_checklist_item" ADD CONSTRAINT "trip_checklist_item_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_checklist_item" ADD CONSTRAINT "trip_checklist_item_section_id_trip_checklist_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."trip_checklist_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_checklist_section" ADD CONSTRAINT "trip_checklist_section_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Copy the list that used to be built into the app onto the Thailand trip, keyed so existing ticks can follow.
INSERT INTO "trip_checklist_section" ("id", "trip_id", "title", "detail", "position")
SELECT md5(t.id::text || ':' || s.key)::uuid, t.id, s.title, s.detail, s.position
FROM "trip" AS t
CROSS JOIN (VALUES
  ('money', 'Money & insurance', 'Before the trip', 0),
  ('entry', 'Entry & phone', 'Sort before Dec 22', 1),
  ('docs', 'Documents', 'Phone covers the rest', 2),
  ('bags', 'Bags', 'Small bag travels, big bag waits at DMK until Jan 1', 3),
  ('clothes', 'Clothes & shoes', 'Hot and humid, cooler evenings in Chiang Mai', 4),
  ('health', 'Health', 'Keep in the cabin bag', 5),
  ('kit', 'Money & tech', 'Cash first, card as backup', 6),
  ('know', 'Before you go', 'For everyone', 7)
) AS s(key, title, detail, position)
WHERE t.destination ILIKE '%thailand%';--> statement-breakpoint
INSERT INTO "trip_checklist_item" ("id", "trip_id", "section_id", "label", "note", "position")
SELECT md5(s.trip_id::text || ':' || i.key)::uuid, s.trip_id, s.id, i.label, i.note, i.position
FROM (VALUES
  ('money', 'm-cash', 'Buy 25,000 THB cash', '20,000 is the immigration minimum. Compare exchange rates before you buy.', 0),
  ('money', 'm-ins', 'Buy travel insurance', 'Cover the full trip dates. Keep the policy PDF on your phone.', 1),
  ('entry', 'e-tdac', 'Thailand Digital Arrival Card (TDAC)', 'Mandatory, one per person. Free at tdac.immigration.go.th. Submit within 72 hours before arrival, so Dec 20–22.', 0),
  ('entry', 'e-sim', 'Mobile data: eSIM, Thai SIM, or Indian roaming pack', 'Needed for Grab, maps, and messaging from the moment you land.', 1),
  ('entry', 'e-apps', 'Apps: Grab, Bolt, InDrive (Phuket), Bangkok Metro, LINE, Google Translate (Thai), Splitkaro/Splitwise', 'Download Google Maps offline areas for Bangkok, Chiang Mai, Phuket, and Krabi.', 2),
  ('entry', 'e-card', 'Add a 0% forex markup card if you have one', '', 3),
  ('entry', 'e-shots', 'Screenshot every booking to the gallery', 'Return flight and hotel bookings too. Insurance and ferries as well, not only an open app.', 4),
  ('entry', 'e-email', 'Email confirmations to yourself', 'Backup for patchy island signal.', 5),
  ('docs', 'd-passport', 'Passport', '6+ months validity from Dec 22.', 0),
  ('docs', 'd-copy', 'Passport photocopy — print', 'Kept separate from the passport itself.', 1),
  ('bags', 'b-big', 'Big bag → AIRPORTELs storage at DMK', 'Dropped Dec 25, collected Jan 1. Leave room for Chatuchak shopping.', 0),
  ('bags', 'b-sling', 'Sling or small day bag', 'Passport, cash, phone — stays on you.', 1),
  ('bags', 'b-dry', 'Dry bag or ziplocs', 'Ferries, longtails, boat days. Dry swimwear before packing on Jan 1.', 2),
  ('bags', 'b-pouch', 'Waterproof phone pouch', 'Longtails and ferries.', 3),
  ('bags', 'b-wet', 'Wet bag: swimwear + quick-dry towel', 'Boat and beach days, Dec 29 – Jan 1.', 4),
  ('clothes', 'c-sun', 'Cap/hat + sunglasses', 'Boat and beach days, Dec 29 – Jan 1.', 0),
  ('clothes', 'c-cover', 'Long trousers + covered top', 'Shoulders and knees covered for the Grand Palace (Dec 23) and Chiang Rai temples (Dec 26).', 1),
  ('clothes', 'c-flip', 'Flip-flops / chappals', 'Showers, beach, hotel.', 2),
  ('clothes', 'c-night', 'Jan 1 night-out outfit + closed shoes', 'Tichuca dress code: closed shoes, no flip-flops, no sleeveless or sportswear.', 3),
  ('health', 'h-meds', 'Basic meds', 'ORS, anti-diarrhoeal, paracetamol. Motion-sickness tablets for ferries and the Chiang Rai drive.', 0),
  ('health', 'h-sun', 'Reef-safe sunscreen', 'Needed Dec 29 – Jan 1. Regular sunscreen is banned in Thai marine parks.', 1),
  ('health', 'h-toil', 'Toothpaste + mosquito repellent', '100 ml or less of each in the cabin bag.', 2),
  ('kit', 'k-cash', '25,000 THB cash — in the sling', 'Carry it. 20,000 is the immigration minimum.', 0),
  ('kit', 'k-notes', 'Small notes for boats and markets', 'Longtails and street stalls won''t break a 1,000.', 1),
  ('kit', 'k-power', 'Power bank', 'Cabin bag only, never checked.', 2),
  ('kit', 'k-adapter', 'International travel adapter', 'Thai sockets are mostly types A, B, C, and O, 220V.', 3),
  ('know', 'g-vape', 'Vapes and e-cigarettes are illegal in Thailand', 'Including bringing them in. Leave them at home.', 0),
  ('know', 'g-sos', 'Save emergency contacts', 'Tourist Police 1155. Indian Embassy Bangkok. Travel insurance helpline.', 1)
) AS i(section_key, key, label, note, position)
JOIN "trip_checklist_section" AS s ON s.id = md5(s.trip_id::text || ':' || i.section_key)::uuid;--> statement-breakpoint
DELETE FROM "trip_checklist_tick" AS k
WHERE NOT EXISTS (
  SELECT 1 FROM "trip_checklist_item" AS i WHERE i.id = md5(k.trip_id::text || ':' || k.item_id)::uuid
);--> statement-breakpoint
UPDATE "trip_checklist_tick" SET "item_id" = md5("trip_id"::text || ':' || "item_id")::uuid::text;--> statement-breakpoint
ALTER TABLE "trip_checklist_tick" ALTER COLUMN "item_id" SET DATA TYPE uuid USING "item_id"::uuid;--> statement-breakpoint
ALTER TABLE "trip_checklist_tick" ADD CONSTRAINT "trip_checklist_tick_item_id_trip_checklist_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."trip_checklist_item"("id") ON DELETE cascade ON UPDATE no action;