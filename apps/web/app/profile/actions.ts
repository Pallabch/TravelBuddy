"use server";

import { saveProfile } from "@travel-buddy/db";
import { profileInput } from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function saveProfileAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const style = formData.get("travelStyle");
  const parsed = profileInput.safeParse({
    homeCity: formData.get("homeCity"),
    bio: formData.get("bio"),
    languages: formData.get("languages"),
    travelStyle: typeof style === "string" ? style : "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await saveProfile(session.user.id, parsed.data);
  return { saved: true as const };
}
