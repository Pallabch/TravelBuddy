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
  deleteItineraryItem,
  updateItineraryItem,
  addLuggage,
  addLuggageItem,
  addLuggageSection,
  deleteLuggage,
  deleteLuggageItem,
  deleteLuggageSection,
  moveLuggageItem,
  moveLuggageItems,
  renameLuggage,
  renameLuggageItem,
  renameLuggageSection,
  setLuggageItemPacked,
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
  luggageItemInput,
  luggageMoveInput,
  luggageMoveManyInput,
  luggageNameInput,
  luggageSectionInput,
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

function readItinerary(formData: FormData) {
  return itineraryInput.safeParse({
    day: formData.get("day"),
    startTime: formData.get("startTime") ?? "",
    title: formData.get("title"),
    location: formData.get("location") ?? "",
    details: formData.get("details") ?? "",
    participants: formData.getAll("participants"),
  });
}

export async function addItineraryAction(tripId: string, formData: FormData) {
  const actorId = await userId();
  const parsed = readItinerary(formData);
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

export async function updateItineraryAction(
  tripId: string,
  itemId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  if (!uuidPattern.test(itemId)) {
    return { error: "That stop is not on this trip." };
  }
  const parsed = readItinerary(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the stop." };
  }
  return attempt(tripId, () => updateItineraryItem(actorId, tripId, itemId, parsed.data));
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

export async function deleteItineraryAction(tripId: string, itemId: string): Promise<Result> {
  const actorId = await userId();
  if (!uuidPattern.test(itemId)) {
    return { error: "That stop is not on this trip." };
  }
  return attempt(tripId, () => deleteItineraryItem(actorId, tripId, itemId));
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
    kind: formData.get("kind") ?? "group",
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

export async function addLuggageAction(tripId: string, formData: FormData): Promise<Result & { id?: string }> {
  const actorId = await userId();
  const parsed = luggageNameInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the luggage." };
  let id: string | undefined;
  const result = await attempt(tripId, async () => {
    id = (await addLuggage(actorId, tripId, parsed.data))?.id;
  });
  return { ...result, id };
}

export async function renameLuggageAction(tripId: string, luggageId: string, formData: FormData): Promise<Result> {
  const actorId = await userId();
  const parsed = luggageNameInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the luggage." };
  return attempt(tripId, () => renameLuggage(actorId, tripId, luggageId, parsed.data));
}

export async function deleteLuggageAction(tripId: string, luggageId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteLuggage(actorId, tripId, luggageId));
}

export async function addLuggageSectionAction(
  tripId: string,
  luggageId: string,
  formData: FormData,
): Promise<Result & { id?: string }> {
  const actorId = await userId();
  const parsed = luggageSectionInput.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the section." };
  let id: string | undefined;
  const result = await attempt(tripId, async () => {
    id = (await addLuggageSection(actorId, tripId, luggageId, parsed.data))?.id;
  });
  return { ...result, id };
}

export async function renameLuggageSectionAction(
  tripId: string,
  sectionId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  const parsed = luggageSectionInput.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the section." };
  return attempt(tripId, () => renameLuggageSection(actorId, tripId, sectionId, parsed.data));
}

export async function deleteLuggageSectionAction(tripId: string, sectionId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteLuggageSection(actorId, tripId, sectionId));
}

export async function addLuggageItemAction(
  tripId: string,
  luggageId: string,
  formData: FormData,
): Promise<Result> {
  const actorId = await userId();
  const rawSection = formData.get("sectionId");
  const parsed = luggageItemInput.safeParse({
    label: formData.get("label"),
    sectionId: typeof rawSection === "string" && rawSection.length > 0 ? rawSection : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Write the item." };
  return attempt(tripId, async () => {
    await addLuggageItem(actorId, tripId, luggageId, parsed.data);
  });
}

export async function moveLuggageItemsAction(
  tripId: string,
  itemIds: string[],
  sectionId: string | null,
  index: number,
): Promise<Result> {
  const actorId = await userId();
  const parsed = luggageMoveManyInput.safeParse({ itemIds, sectionId, index });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "That move did not work." };
  return attempt(tripId, () => moveLuggageItems(actorId, tripId, parsed.data));
}

export async function moveLuggageItemAction(
  tripId: string,
  itemId: string,
  sectionId: string | null,
  index: number,
): Promise<Result> {
  const actorId = await userId();
  const parsed = luggageMoveInput.safeParse({ sectionId, index });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "That move did not work." };
  return attempt(tripId, () => moveLuggageItem(actorId, tripId, itemId, parsed.data));
}

export async function renameLuggageItemAction(tripId: string, itemId: string, formData: FormData): Promise<Result> {
  const actorId = await userId();
  const parsed = luggageItemInput.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Write the item." };
  return attempt(tripId, () => renameLuggageItem(actorId, tripId, itemId, parsed.data));
}

export async function setLuggagePackedAction(tripId: string, itemId: string, packed: boolean): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => setLuggageItemPacked(actorId, tripId, itemId, packed));
}

export async function deleteLuggageItemAction(tripId: string, itemId: string): Promise<Result> {
  const actorId = await userId();
  return attempt(tripId, () => deleteLuggageItem(actorId, tripId, itemId));
}
