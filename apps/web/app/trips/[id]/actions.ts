"use server";

import {
  addExpense,
  addItineraryItem,
  addTripMember,
} from "@travel-buddy/db";
import { expenseInput, itineraryInput } from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

async function userId() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");
  return session.user.id;
}

export async function addMemberAction(tripId: string, memberId: string) {
  const actorId = await userId();
  await addTripMember(actorId, tripId, memberId);
  redirect(`/trips/${tripId}`);
}

export async function addItineraryAction(tripId: string, formData: FormData) {
  const actorId = await userId();
  const parsed = itineraryInput.safeParse({
    day: formData.get("day"),
    title: formData.get("title"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the stop." };
  }
  await addItineraryItem(actorId, tripId, parsed.data);
  redirect(`/trips/${tripId}`);
}

export async function addExpenseAction(tripId: string, formData: FormData) {
  const actorId = await userId();
  const parsed = expenseInput.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    paidBy: formData.get("paidBy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the expense." };
  }
  await addExpense(actorId, tripId, parsed.data);
  redirect(`/trips/${tripId}`);
}
