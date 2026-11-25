import { and, asc, eq, or, sql } from "drizzle-orm";
import type { ChecklistItemInput, ChecklistKind, ChecklistSectionInput } from "@travel-buddy/validators";
import { db } from "./client.ts";
import {
  trip,
  tripChecklistItem,
  tripChecklistSection,
  tripChecklistTick,
  tripMember,
} from "./schema.ts";
import { getTripForMember } from "./trip-detail.ts";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SectionRow = typeof tripChecklistSection.$inferSelect;

async function requireMember(userId: string, tripId: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  return tripRow;
}

async function touchGroup(tx: Tx, tripId: string, actorId: string) {
  await tx
    .update(trip)
    .set({ checklistUpdatedBy: actorId, checklistUpdatedAt: new Date() })
    .where(eq(trip.id, tripId));
}

async function requireSection(tx: Tx | typeof db, tripId: string, sectionId: string, actorId: string) {
  const [row] = await tx
    .select()
    .from(tripChecklistSection)
    .where(and(eq(tripChecklistSection.id, sectionId), eq(tripChecklistSection.tripId, tripId)))
    .limit(1);
  if (!row) throw new Error("That section is not on this trip.");
  if (row.kind === "personal" && row.ownerId !== actorId) {
    throw new Error("That personal checklist is not yours.");
  }
  return row;
}

async function requireItem(tx: Tx | typeof db, tripId: string, itemId: string, actorId: string) {
  const [row] = await tx
    .select({
      id: tripChecklistItem.id,
      sectionId: tripChecklistItem.sectionId,
      kind: tripChecklistSection.kind,
      ownerId: tripChecklistSection.ownerId,
    })
    .from(tripChecklistItem)
    .innerJoin(tripChecklistSection, eq(tripChecklistSection.id, tripChecklistItem.sectionId))
    .where(and(eq(tripChecklistItem.id, itemId), eq(tripChecklistItem.tripId, tripId)))
    .limit(1);
  if (!row) throw new Error("That item is not on this trip.");
  if (row.kind === "personal" && row.ownerId !== actorId) {
    throw new Error("That personal checklist is not yours.");
  }
  return row;
}

function mapSections(
  sections: SectionRow[],
  items: (typeof tripChecklistItem.$inferSelect)[],
  tickedBy: Map<string, string[]>,
) {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    detail: section.detail,
    updatedBy: section.updatedBy,
    updatedAt: section.updatedAt.toISOString(),
    items: items
      .filter((item) => item.sectionId === section.id)
      .map((item) => ({
        id: item.id,
        label: item.label,
        note: item.note,
        updatedBy: item.updatedBy,
        updatedAt: item.updatedAt.toISOString(),
        tickedBy: tickedBy.get(item.id) ?? [],
      })),
  }));
}

export async function getChecklist(userId: string, tripId: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) return null;

  const [meta, sections, items, ticks] = await Promise.all([
    db
      .select({ updatedBy: trip.checklistUpdatedBy, updatedAt: trip.checklistUpdatedAt })
      .from(trip)
      .where(eq(trip.id, tripId))
      .limit(1),
    db
      .select()
      .from(tripChecklistSection)
      .where(
        and(
          eq(tripChecklistSection.tripId, tripId),
          or(
            eq(tripChecklistSection.kind, "group"),
            and(eq(tripChecklistSection.kind, "personal"), eq(tripChecklistSection.ownerId, userId)),
          ),
        ),
      )
      .orderBy(asc(tripChecklistSection.position), asc(tripChecklistSection.updatedAt)),
    db
      .select()
      .from(tripChecklistItem)
      .where(eq(tripChecklistItem.tripId, tripId))
      .orderBy(asc(tripChecklistItem.position), asc(tripChecklistItem.updatedAt)),
    db
      .select({ itemId: tripChecklistTick.itemId, userId: tripChecklistTick.userId })
      .from(tripChecklistTick)
      .innerJoin(
        tripMember,
        and(eq(tripMember.tripId, tripChecklistTick.tripId), eq(tripMember.userId, tripChecklistTick.userId)),
      )
      .where(eq(tripChecklistTick.tripId, tripId)),
  ]);

  const visibleSectionIds = new Set(sections.map((section) => section.id));
  const visibleItems = items.filter((item) => visibleSectionIds.has(item.sectionId));

  const tickedBy = new Map<string, string[]>();
  for (const tick of ticks) {
    tickedBy.set(tick.itemId, [...(tickedBy.get(tick.itemId) ?? []), tick.userId]);
  }

  const groupSections = sections.filter((section) => section.kind === "group");
  const personalSections = sections.filter((section) => section.kind === "personal");

  const ids = new Set<string>();
  if (meta[0]?.updatedBy) ids.add(meta[0].updatedBy);
  for (const row of [...groupSections, ...visibleItems]) if (row.updatedBy) ids.add(row.updatedBy);
  for (const tick of ticks) ids.add(tick.userId);
  const names: Record<string, string> = {};
  if (ids.size > 0) {
    const result = await db.execute<{ id: string; name: string }>(sql`
      SELECT id::text AS id, name FROM neon_auth."user"
      WHERE id::text IN (${sql.join([...ids].map((id) => sql`${id}`), sql`, `)})
    `);
    for (const row of result.rows) names[row.id] = row.name;
  }

  const personalUpdated = personalSections
    .map((section) => section.updatedAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    group: {
      updatedBy: meta[0]?.updatedBy ?? null,
      updatedAt: meta[0]?.updatedAt?.toISOString() ?? null,
      names,
      sections: mapSections(groupSections, visibleItems, tickedBy),
    },
    personal: {
      updatedBy: null,
      updatedAt: personalUpdated?.toISOString() ?? null,
      names: {},
      sections: mapSections(personalSections, visibleItems, tickedBy),
    },
  };
}

export async function addChecklistSection(
  actorId: string,
  tripId: string,
  input: ChecklistSectionInput,
) {
  await requireMember(actorId, tripId);
  const kind: ChecklistKind = input.kind ?? "group";
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(tripChecklistSection)
      .values({
        tripId,
        kind,
        ownerId: kind === "personal" ? actorId : null,
        title: input.title,
        detail: input.detail,
        updatedBy: actorId,
        position:
          kind === "personal"
            ? sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_checklist_section WHERE trip_id = ${tripId} AND kind = 'personal' AND owner_id = ${actorId})`
            : sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_checklist_section WHERE trip_id = ${tripId} AND kind = 'group')`,
      })
      .returning({ id: tripChecklistSection.id });
    if (kind === "group") await touchGroup(tx, tripId, actorId);
    return row;
  });
}

export async function updateChecklistSection(
  actorId: string,
  tripId: string,
  sectionId: string,
  input: ChecklistSectionInput,
) {
  await requireMember(actorId, tripId);
  await db.transaction(async (tx) => {
    const section = await requireSection(tx, tripId, sectionId, actorId);
    await tx
      .update(tripChecklistSection)
      .set({ title: input.title, detail: input.detail, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(tripChecklistSection.id, sectionId));
    if (section.kind === "group") await touchGroup(tx, tripId, actorId);
  });
}

export async function deleteChecklistSection(actorId: string, tripId: string, sectionId: string) {
  await requireMember(actorId, tripId);
  await db.transaction(async (tx) => {
    const section = await requireSection(tx, tripId, sectionId, actorId);
    await tx.delete(tripChecklistSection).where(eq(tripChecklistSection.id, sectionId));
    if (section.kind === "group") await touchGroup(tx, tripId, actorId);
  });
}

export async function addChecklistItem(
  actorId: string,
  tripId: string,
  sectionId: string,
  input: ChecklistItemInput,
) {
  await requireMember(actorId, tripId);
  return db.transaction(async (tx) => {
    const section = await requireSection(tx, tripId, sectionId, actorId);
    const [row] = await tx
      .insert(tripChecklistItem)
      .values({
        tripId,
        sectionId,
        label: input.label,
        note: input.note,
        updatedBy: actorId,
        position: sql`(SELECT coalesce(max(position), -1) + 1 FROM trip_checklist_item WHERE section_id = ${sectionId})`,
      })
      .returning({ id: tripChecklistItem.id });
    await tx
      .update(tripChecklistSection)
      .set({ updatedBy: actorId, updatedAt: new Date() })
      .where(eq(tripChecklistSection.id, sectionId));
    if (section.kind === "group") await touchGroup(tx, tripId, actorId);
    return row;
  });
}

export async function updateChecklistItem(
  actorId: string,
  tripId: string,
  itemId: string,
  input: ChecklistItemInput,
) {
  await requireMember(actorId, tripId);
  await db.transaction(async (tx) => {
    const item = await requireItem(tx, tripId, itemId, actorId);
    await tx
      .update(tripChecklistItem)
      .set({ label: input.label, note: input.note, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(tripChecklistItem.id, itemId));
    await tx
      .update(tripChecklistSection)
      .set({ updatedBy: actorId, updatedAt: new Date() })
      .where(eq(tripChecklistSection.id, item.sectionId));
    if (item.kind === "group") await touchGroup(tx, tripId, actorId);
  });
}

export async function deleteChecklistItem(actorId: string, tripId: string, itemId: string) {
  await requireMember(actorId, tripId);
  await db.transaction(async (tx) => {
    const item = await requireItem(tx, tripId, itemId, actorId);
    await tx.delete(tripChecklistItem).where(eq(tripChecklistItem.id, itemId));
    await tx
      .update(tripChecklistSection)
      .set({ updatedBy: actorId, updatedAt: new Date() })
      .where(eq(tripChecklistSection.id, item.sectionId));
    if (item.kind === "group") await touchGroup(tx, tripId, actorId);
  });
}

export async function setChecklistTick(userId: string, tripId: string, itemId: string, checked: boolean) {
  await requireMember(userId, tripId);
  await requireItem(db, tripId, itemId, userId);
  if (checked) {
    await db.insert(tripChecklistTick).values({ tripId, userId, itemId }).onConflictDoNothing();
    return;
  }
  await db
    .delete(tripChecklistTick)
    .where(
      and(
        eq(tripChecklistTick.tripId, tripId),
        eq(tripChecklistTick.userId, userId),
        eq(tripChecklistTick.itemId, itemId),
      ),
    );
}
