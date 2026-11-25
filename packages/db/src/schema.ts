import {
  boolean,
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
  currency: text("currency").notNull().default("INR"),
  checklistUpdatedBy: text("checklist_updated_by"),
  checklistUpdatedAt: timestamp("checklist_updated_at", { withTimezone: true }),
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
  startTime: text("start_time"),
  title: text("title").notNull(),
  location: text("location").notNull().default(""),
  details: text("details").notNull().default(""),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// No rows for a stop means everyone on the trip, including people added later.
export const tripItineraryParticipant = pgTable(
  "trip_itinerary_participant",
  {
    itineraryId: uuid("itinerary_id")
      .notNull()
      .references(() => tripItinerary.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.itineraryId, table.userId] })],
);

export const tripDocument = pgTable("trip_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("Other"),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const personalDocument = pgTable("personal_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripChecklistSection = pgTable("trip_checklist_section", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  // group = shared by the trip; personal = only ownerId can see or edit.
  kind: text("kind").notNull().default("group").$type<"group" | "personal">(),
  ownerId: text("owner_id"),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  position: integer("position").notNull().default(0),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripChecklistItem = pgTable("trip_checklist_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => tripChecklistSection.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  note: text("note").notNull().default(""),
  position: integer("position").notNull().default(0),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// One row per person per ticked item, so each traveller keeps their own progress.
export const tripChecklistTick = pgTable(
  "trip_checklist_tick",
  {
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => tripChecklistItem.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.userId, table.itemId] })],
);

// A bag belongs to one traveller. Other people on the trip cannot read it.
export const tripLuggage = pgTable("trip_luggage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripLuggageSection = pgTable("trip_luggage_section", {
  id: uuid("id").primaryKey().defaultRandom(),
  luggageId: uuid("luggage_id")
    .notNull()
    .references(() => tripLuggage.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
});

export const tripLuggageItem = pgTable("trip_luggage_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  luggageId: uuid("luggage_id")
    .notNull()
    .references(() => tripLuggage.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id").references(() => tripLuggageSection.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  packed: boolean("packed").notNull().default(false),
  position: integer("position").notNull().default(0),
});

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
  category: text("category").notNull().default("General"),
  spentOn: date("spent_on").defaultNow().notNull(),
  splitType: text("split_type", { enum: ["equal", "exact", "percent", "shares"] })
    .notNull()
    .default("equal"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// What each person owes for one expense. The shares add up to the amount.
export const tripExpenseShare = pgTable(
  "trip_expense_share",
  {
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => tripExpense.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    shareCents: integer("share_cents").notNull(),
  },
  (table) => [primaryKey({ columns: [table.expenseId, table.userId] })],
);

export const tripSettlement = pgTable("trip_settlement", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trip.id, { onDelete: "cascade" }),
  fromUser: text("from_user").notNull(),
  toUser: text("to_user").notNull(),
  amountCents: integer("amount_cents").notNull(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
