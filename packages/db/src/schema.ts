import {
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const profile = pgTable("profile", {
  userId: text("user_id").primaryKey(),
  homeCity: text("home_city").notNull().default(""),
  bio: text("bio").notNull().default(""),
  languages: text("languages").notNull().default(""),
  travelStyle: text("travel_style").notNull().default(""),
  avatarKey: text("avatar_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trip = pgTable("trip", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  coverKey: text("cover_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripMember = pgTable(
  "trip_member",
  {
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.userId] })],
);

export const tripItinerary = pgTable("trip_itinerary", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  title: text("title").notNull(),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripDocument = pgTable("trip_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripChecklistTick = pgTable(
  "trip_checklist_tick",
  {
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.userId, table.itemId] })],
);

export const tripTicket = pgTable("trip_ticket", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripExpense = pgTable("trip_expense", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paidBy: text("paid_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
