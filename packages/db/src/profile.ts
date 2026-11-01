import { eq } from "drizzle-orm";
import type { ProfileInput } from "@travel-buddy/validators";
import { db } from "./client.ts";
import { profile } from "./schema.ts";

export async function getProfile(userId: string) {
  await db.insert(profile).values({ userId }).onConflictDoNothing();
  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  if (!row) {
    throw new Error("The profile was not created.");
  }
  return row;
}

export async function saveProfile(userId: string, input: ProfileInput) {
  await getProfile(userId);
  await db
    .update(profile)
    .set({
      homeCity: input.homeCity,
      bio: input.bio,
      languages: input.languages,
      travelStyle: input.travelStyle,
      updatedAt: new Date(),
    })
    .where(eq(profile.userId, userId));
}

export async function setAvatarKey(userId: string, avatarKey: string) {
  const current = await getProfile(userId);
  await db
    .update(profile)
    .set({ avatarKey, updatedAt: new Date() })
    .where(eq(profile.userId, userId));
  return current.avatarKey;
}
