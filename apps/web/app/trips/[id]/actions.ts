"use server";

import {
  addExpense,
  addItineraryItem,
  addTripMember,
  deleteTrip,
  removeTripMember,
  setChecklistTick,
} from "@travel-buddy/db";
import { expenseInput, itineraryInput } from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

async function userId() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");
  return session.user.id;
}

export async function setChecklistTickAction(tripId: string, itemId: string, checked: boolean) {
  const actorId = await userId();
  if (!/^[a-z]+-[a-z]+$/.test(itemId)) {
    throw new Error("That checklist item is not on this trip.");
  }
  await setChecklistTick(actorId, tripId, itemId, checked);
}

export async function removeMemberAction(tripId: string, memberId: string) {
  const actorId = await userId();
  await removeTripMember(actorId, tripId, memberId);
  redirect(`/trips/${tripId}`);
}

export async function deleteTripAction(tripId: string) {
  const actorId = await userId();
  await deleteTrip(actorId, tripId);
  redirect("/trips");
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
