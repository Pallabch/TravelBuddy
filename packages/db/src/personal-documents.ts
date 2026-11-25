import { and, desc, eq } from "drizzle-orm";
import { db } from "./client.ts";
import { personalDocument } from "./schema.ts";

export async function listPersonalDocuments(userId: string) {
  return db
    .select()
    .from(personalDocument)
    .where(eq(personalDocument.userId, userId))
    .orderBy(desc(personalDocument.createdAt));
}

export async function addPersonalDocument(
  userId: string,
  input: { name: string; category: string; objectKey: string; contentType: string },
) {
  await db.insert(personalDocument).values({ userId, ...input });
}

export async function getPersonalDocument(userId: string, documentId: string) {
  const [row] = await db
    .select()
    .from(personalDocument)
    .where(and(eq(personalDocument.id, documentId), eq(personalDocument.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function renamePersonalDocument(userId: string, documentId: string, name: string) {
  const [row] = await db
    .update(personalDocument)
    .set({ name })
    .where(and(eq(personalDocument.id, documentId), eq(personalDocument.userId, userId)))
    .returning({ id: personalDocument.id });
  return Boolean(row);
}

export async function deletePersonalDocument(userId: string, documentId: string) {
  const [row] = await db
    .delete(personalDocument)
    .where(and(eq(personalDocument.id, documentId), eq(personalDocument.userId, userId)))
    .returning({ objectKey: personalDocument.objectKey });
  return row?.objectKey ?? null;
}
