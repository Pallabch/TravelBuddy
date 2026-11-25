"use server";

import {
  addChecklistItem,
  addChecklistSection,
  deleteChecklistItem,
  deleteChecklistSection,
  updateChecklistItem,
  updateChecklistSection,
  addExpense,
  addItineraryItem,
  addSettlement,
  addTripMember,
  deleteExpense,
  deleteSettlement,
  deleteTrip,
  removeTripMember,
  setChecklistTick,
  setTripCurrency,
  updateExpense,
} from "@travel-buddy/db";
import {
  checklistItemInput,
  checklistSectionInput,
  expenseInput,
  itineraryInput,
  settlementInput,
} from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function userId() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");
  return session.user.id;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setChecklistTickAction(tripId: string, itemId: string, checked: boolean) {
  const actorId = await userId();
  if (!uuidPattern.test(itemId)) {
    throw new Error("That checklist item is not on this trip.");
  }
  await setChecklistTick(actorId, tripId, itemId, checked);
  revalidatePath(`/trips/${tripId}`);
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
    startTime: formData.get("startTime") ?? "",
    title: formData.get("title"),
    location: formData.get("location") ?? "",
    details: formData.get("details") ?? "",
    participants: formData.getAll("participants"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the stop." };
  }
  try {
    await addItineraryItem(actorId, tripId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The stop was not saved." };
  }
  redirect(`/trips/${tripId}`);
}

type Result = { error?: string };

async function attempt(tripId: string, work: () => Promise<void>): Promise<Result> {
  try {
    await work();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That did not save." };
  }
  revalidatePath(`/trips/${tripId}`);
  return {};
}

function readExpense(formData: FormData) {
  const participants = formData.getAll("participants").map(String);
  const values: Record<string, string> = {};
  for (const id of participants) {
    values[id] = String(formData.get(`value-${id}`) ?? "");
  }
  return expenseInput.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category") || "General",
    spentOn: formData.get("spentOn"),
    paidBy: formData.get("paidBy"),
    splitType: formData.get("splitType"),
    values,
    participants,
  });
}

export async function addExpenseAction(tripId: string, formData: FormData): Promise<Result> {
  const actorId = await userId();
  const parsed = readExpense(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the expense." };
  }
  return attempt(tripId, () => addExpense(actorId, tripId, parsed.data));
}

export async function updateExpenseAction(
  tripId: string,
  expenseId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  if (!uuidPattern.test(expenseId)) {
    return { error: "That expense is not on this trip." };
  }
  const parsed = readExpense(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the expense." };
  }
  return attempt(tripId, () => updateExpense(actorId, tripId, expenseId, parsed.data));
}

export async function deleteExpenseAction(tripId: string, expenseId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteExpense(actorId, tripId, expenseId));
}

export async function addSettlementAction(
  tripId: string,
  input: { fromUser: string; toUser: string; amount: string },
): Promise<Result> {
  const actorId = await userId();
  const parsed = settlementInput.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payment." };
  }
  return attempt(tripId, () => addSettlement(actorId, tripId, parsed.data));
}

export async function deleteSettlementAction(tripId: string, settlementId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteSettlement(actorId, tripId, settlementId));
}

export async function setCurrencyAction(tripId: string, currency: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => setTripCurrency(actorId, tripId, currency));
}

function readSection(formData: FormData) {
  return checklistSectionInput.safeParse({
    title: formData.get("title"),
    detail: formData.get("detail") ?? "",
  });
}

function readItem(formData: FormData) {
  return checklistItemInput.safeParse({
    label: formData.get("label"),
    note: formData.get("note") ?? "",
  });
}

export async function addChecklistSectionAction(
  tripId: string,
  formData: FormData,
): Promise<Result & { id?: string }> {
  const actorId = await userId();
  const parsed = readSection(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the section." };
  let id: string | undefined;
  const result = await attempt(tripId, async () => {
    id = (await addChecklistSection(actorId, tripId, parsed.data))?.id;
  });
  return { ...result, id };
}

export async function updateChecklistSectionAction(
  tripId: string,
  sectionId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  const parsed = readSection(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the section." };
  return attempt(tripId, () => updateChecklistSection(actorId, tripId, sectionId, parsed.data));
}

export async function deleteChecklistSectionAction(tripId: string, sectionId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteChecklistSection(actorId, tripId, sectionId));
}

export async function addChecklistItemAction(
  tripId: string,
  sectionId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the item." };
  return attempt(tripId, async () => {
    await addChecklistItem(actorId, tripId, sectionId, parsed.data);
  });
}

export async function updateChecklistItemAction(
  tripId: string,
  itemId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the item." };
  return attempt(tripId, () => updateChecklistItem(actorId, tripId, itemId, parsed.data));
}

export async function deleteChecklistItemAction(tripId: string, itemId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteChecklistItem(actorId, tripId, itemId));
}
