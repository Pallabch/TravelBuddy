"use server";

import { createTripForUser } from "@travel-buddy/db";
import { createTripInput } from "@travel-buddy/validators";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function createTripAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const parsed = createTripInput.safeParse({
    title: formData.get("title"),
    destination: formData.get("destination"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await createTripForUser(parsed.data, session.user.id);
  redirect("/trips");
}
