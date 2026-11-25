import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type {
  LuggageItemInput,
  LuggageMoveInput,
  LuggageMoveManyInput,
  LuggageNameInput,
  LuggageSectionInput,
} from "@travel-buddy/validators";
import { db } from "./client.ts";
import { tripLuggage, tripLuggageItem, tripLuggageSection } from "./schema.ts";
import { getTripForMember } from "./trip-detail.ts";

async function requireMember(actorId: string, tripId: string) {
  const tripRow = await getTripForMember(actorId, tripId);
  if (!tripRow) throw new Error("You are not on this trip.");
}

async function requireBag(actorId: string, tripId: string, luggageId: string) {
  await requireMember(actorId, tripId);
  const [bag] = await db
    .select()
    .from(tripLuggage)
    .where(
      and(eq(tripLuggage.id, luggageId), eq(tripLuggage.tripId, tripId), eq(tripLuggage.ownerId, actorId)),
    )
    .limit(1);
  if (!bag) throw new Error("That luggage is not yours.");
  return bag;
}

async function requireSection(actorId: string, tripId: string, sectionId: string) {
  await requireMember(actorId, tripId);
  const [row] = await db
    .select({ id: tripLuggageSection.id, luggageId: tripLuggageSection.luggageId })
    .from(tripLuggageSection)
    .innerJoin(tripLuggage, eq(tripLuggage.id, tripLuggageSection.luggageId))
    .where(
      and(
        eq(tripLuggageSection.id, sectionId),
        eq(tripLuggage.tripId, tripId),
        eq(tripLuggage.ownerId, actorId),
      ),
    )
    .limit(1);
  if (!row) throw new Error("That section is not yours.");
  return row;
}

async function requireItem(actorId: string, tripId: string, itemId: string) {
  await requireMember(actorId, tripId);
  const [row] = await db
    .select({
      id: tripLuggageItem.id,
      luggageId: tripLuggageItem.luggageId,
      sectionId: tripLuggageItem.sectionId,
    })
    .from(tripLuggageItem)
    .innerJoin(tripLuggage, eq(tripLuggage.id, tripLuggageItem.luggageId))
    .where(
      and(eq(tripLuggageItem.id, itemId), eq(tripLuggage.tripId, tripId), eq(tripLuggage.ownerId, actorId)),
    )
    .limit(1);
  if (!row) throw new Error("That item is not yours.");
  return row;
}

export async function getLuggage(actorId: string, tripId: string) {
  const tripRow = await getTripForMember(actorId, tripId);
  if (!tripRow) return null;

  const bags = await db
    .select()
    .from(tripLuggage)
    .where(and(eq(tripLuggage.tripId, tripId), eq(tripLuggage.ownerId, actorId)))
    .orderBy(asc(tripLuggage.position), asc(tripLuggage.createdAt));
  if (bags.length === 0) return [];

  const bagIds = bags.map((bag) => bag.id);
  const sections = await db
    .select()
    .from(tripLuggageSection)
    .where(inArray(tripLuggageSection.luggageId, bagIds))
    .orderBy(asc(tripLuggageSection.position));
  const items = await db
    .select()
    .from(tripLuggageItem)
    .where(inArray(tripLuggageItem.luggageId, bagIds))
    .orderBy(asc(tripLuggageItem.position));

  return bags.map((bag) => ({
    id: bag.id,
    name: bag.name,
    items: items
      .filter((item) => item.luggageId === bag.id && item.sectionId === null)
      .map((item) => ({ id: item.id, label: item.label, packed: item.packed })),
    sections: sections
      .filter((section) => section.luggageId === bag.id)
      .map((section) => ({
        id: section.id,
        title: section.title,
        items: items
          .filter((item) => item.sectionId === section.id)
          .map((item) => ({ id: item.id, label: item.label, packed: item.packed })),
      })),
  }));
}

export async function addLuggage(actorId: string, tripId: string, input: LuggageNameInput) {
  await requireMember(actorId, tripId);
  const [row] = await db
    .insert(tripLuggage)
    .values({
      tripId,
      ownerId: actorId,
      name: input.name,
      position: sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_luggage WHERE trip_id = ${tripId} AND owner_id = ${actorId})`,
    })
    .returning({ id: tripLuggage.id });
  return row;
}

export async function renameLuggage(
  actorId: string,
  tripId: string,
  luggageId: string,
  input: LuggageNameInput,
) {
  await requireBag(actorId, tripId, luggageId);
  await db.update(tripLuggage).set({ name: input.name }).where(eq(tripLuggage.id, luggageId));
}

export async function deleteLuggage(actorId: string, tripId: string, luggageId: string) {
  await requireBag(actorId, tripId, luggageId);
  await db.delete(tripLuggage).where(eq(tripLuggage.id, luggageId));
}

export async function addLuggageSection(
  actorId: string,
  tripId: string,
  luggageId: string,
  input: LuggageSectionInput,
) {
  await requireBag(actorId, tripId, luggageId);
  const [row] = await db
    .insert(tripLuggageSection)
    .values({
      luggageId,
      title: input.title,
      position: sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_luggage_section WHERE luggage_id = ${luggageId})`,
    })
    .returning({ id: tripLuggageSection.id });
  return row;
}

export async function renameLuggageSection(
  actorId: string,
  tripId: string,
  sectionId: string,
  input: LuggageSectionInput,
) {
  await requireSection(actorId, tripId, sectionId);
  await db.update(tripLuggageSection).set({ title: input.title }).where(eq(tripLuggageSection.id, sectionId));
}

export async function deleteLuggageSection(actorId: string, tripId: string, sectionId: string) {
  const section = await requireSection(actorId, tripId, sectionId);
  await db.transaction(async (tx) => {
    const loose = await tx
      .select({ id: tripLuggageItem.id })
      .from(tripLuggageItem)
      .where(and(eq(tripLuggageItem.luggageId, section.luggageId), isNull(tripLuggageItem.sectionId)))
      .orderBy(asc(tripLuggageItem.position));
    const grouped = await tx
      .select({ id: tripLuggageItem.id })
      .from(tripLuggageItem)
      .where(eq(tripLuggageItem.sectionId, section.id))
      .orderBy(asc(tripLuggageItem.position));
    for (let index = 0; index < grouped.length; index += 1) {
      await tx
        .update(tripLuggageItem)
        .set({ sectionId: null, position: loose.length + index })
        .where(eq(tripLuggageItem.id, grouped[index]!.id));
    }
    await tx.delete(tripLuggageSection).where(eq(tripLuggageSection.id, section.id));
  });
}

export async function addLuggageItem(
  actorId: string,
  tripId: string,
  luggageId: string,
  input: LuggageItemInput,
) {
  await requireBag(actorId, tripId, luggageId);
  const sectionId = input.sectionId ?? null;
  if (sectionId) {
    const section = await requireSection(actorId, tripId, sectionId);
    if (section.luggageId !== luggageId) throw new Error("That section is not in this bag.");
  }
  const position = sectionId
    ? sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_luggage_item WHERE luggage_id = ${luggageId} AND section_id = ${sectionId})`
    : sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_luggage_item WHERE luggage_id = ${luggageId} AND section_id IS NULL)`;
  const [row] = await db
    .insert(tripLuggageItem)
    .values({
      luggageId,
      sectionId,
      label: input.label,
      position,
    })
    .returning({ id: tripLuggageItem.id });
  return row;
}

export async function renameLuggageItem(
  actorId: string,
  tripId: string,
  itemId: string,
  input: LuggageItemInput,
) {
  await requireItem(actorId, tripId, itemId);
  await db.update(tripLuggageItem).set({ label: input.label }).where(eq(tripLuggageItem.id, itemId));
}

export async function moveLuggageItem(
  actorId: string,
  tripId: string,
  itemId: string,
  input: LuggageMoveInput,
) {
  const item = await requireItem(actorId, tripId, itemId);
  if (input.sectionId) {
    const section = await requireSection(actorId, tripId, input.sectionId);
    if (section.luggageId !== item.luggageId) throw new Error("That section is not in this bag.");
  }

  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: tripLuggageItem.id, sectionId: tripLuggageItem.sectionId })
      .from(tripLuggageItem)
      .where(eq(tripLuggageItem.luggageId, item.luggageId))
      .orderBy(asc(tripLuggageItem.position));
    const sourceId = item.sectionId;
    const sameList = sourceId === input.sectionId;
    const source = rows.filter((row) => row.sectionId === sourceId && row.id !== itemId);
    const destination = sameList
      ? source
      : rows.filter((row) => row.sectionId === input.sectionId && row.id !== itemId);
    const index = Math.max(0, Math.min(input.index, destination.length));
    destination.splice(index, 0, { id: itemId, sectionId: input.sectionId });
    for (let position = 0; position < destination.length; position += 1) {
      await tx
        .update(tripLuggageItem)
        .set({ sectionId: input.sectionId, position })
        .where(eq(tripLuggageItem.id, destination[position]!.id));
    }
    if (!sameList) {
      for (let position = 0; position < source.length; position += 1) {
        await tx
          .update(tripLuggageItem)
          .set({ position })
          .where(eq(tripLuggageItem.id, source[position]!.id));
      }
    }
  });
}

export async function moveLuggageItems(
  actorId: string,
  tripId: string,
  input: LuggageMoveManyInput,
) {
  const itemIds = [...new Set(input.itemIds)];
  const first = await requireItem(actorId, tripId, itemIds[0]!);
  if (input.sectionId) {
    const section = await requireSection(actorId, tripId, input.sectionId);
    if (section.luggageId !== first.luggageId) throw new Error("That section is not in this bag.");
  }

  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: tripLuggageItem.id, sectionId: tripLuggageItem.sectionId })
      .from(tripLuggageItem)
      .where(eq(tripLuggageItem.luggageId, first.luggageId))
      .orderBy(asc(tripLuggageItem.position));
    const known = new Set(rows.map((row) => row.id));
    if (itemIds.some((id) => !known.has(id))) throw new Error("That item is not yours.");
    const moving = new Set(itemIds);
    const movingOrder = rows.filter((row) => moving.has(row.id)).map((row) => row.id);
    const lists = new Map<string | null, string[]>();
    for (const row of rows) {
      if (moving.has(row.id)) continue;
      const list = lists.get(row.sectionId) ?? [];
      list.push(row.id);
      lists.set(row.sectionId, list);
    }
    const destination = lists.get(input.sectionId) ?? [];
    const index = Math.max(0, Math.min(input.index, destination.length));
    destination.splice(index, 0, ...movingOrder);
    lists.set(input.sectionId, destination);

    const touched = new Set<string | null>([input.sectionId]);
    for (const row of rows) {
      if (moving.has(row.id)) touched.add(row.sectionId);
    }
    for (const sectionId of touched) {
      const list = lists.get(sectionId) ?? [];
      for (let position = 0; position < list.length; position += 1) {
        await tx
          .update(tripLuggageItem)
          .set({ sectionId, position })
          .where(eq(tripLuggageItem.id, list[position]!));
      }
    }
  });
}

export async function setLuggageItemPacked(
  actorId: string,
  tripId: string,
  itemId: string,
  packed: boolean,
) {
  await requireItem(actorId, tripId, itemId);
  await db.update(tripLuggageItem).set({ packed }).where(eq(tripLuggageItem.id, itemId));
}

export async function deleteLuggageItem(actorId: string, tripId: string, itemId: string) {
  await requireItem(actorId, tripId, itemId);
  await db.delete(tripLuggageItem).where(eq(tripLuggageItem.id, itemId));
}
