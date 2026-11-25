import { and, eq, sql } from "drizzle-orm";
import {
  computeSplit,
  currencies,
  toCents,
  type ExpenseInput,
  type SettlementInput,
} from "@travel-buddy/validators";
import { db } from "./client.ts";
import { trip, tripExpense, tripExpenseShare, tripSettlement } from "./schema.ts";
import { getTripForMember, listTripPeople } from "./trip-detail.ts";

async function requireMember(userId: string, tripId: string) {
  const tripRow = await getTripForMember(userId, tripId);
  if (!tripRow) {
    throw new Error("You are not on this trip.");
  }
  return tripRow;
}

export async function getTripLedger(tripId: string) {
  const [expenseResult, shareResult, settlementResult, currencyRow, people] = await Promise.all([
    db.execute<{
      id: string;
      title: string;
      amount_cents: number;
      paid_by: string;
      category: string;
      spent_on: string;
      split_type: "equal" | "exact" | "percent" | "shares";
      added_by: string | null;
    }>(sql`
      SELECT id, title, amount_cents, paid_by, category, to_char(spent_on, 'YYYY-MM-DD') AS spent_on,
        split_type, added_by
      FROM trip_expense
      WHERE trip_id = ${tripId}
      ORDER BY spent_on DESC, created_at DESC
    `),
    db.execute<{ expense_id: string; user_id: string; share_cents: number }>(sql`
      SELECT s.expense_id, s.user_id, s.share_cents
      FROM trip_expense_share AS s
      JOIN trip_expense AS e ON e.id = s.expense_id
      WHERE e.trip_id = ${tripId}
    `),
    db.execute<{
      id: string;
      from_user: string;
      to_user: string;
      amount_cents: number;
      added_by: string;
      created_on: string;
    }>(sql`
      SELECT id, from_user, to_user, amount_cents, added_by,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS created_on
      FROM trip_settlement
      WHERE trip_id = ${tripId}
      ORDER BY created_at DESC
    `),
    db.select({ currency: trip.currency }).from(trip).where(eq(trip.id, tripId)).limit(1),
    listTripPeople(tripId),
  ]);

  const sharesByExpense = new Map<string, { userId: string; cents: number }[]>();
  for (const row of shareResult.rows) {
    const list = sharesByExpense.get(row.expense_id) ?? [];
    list.push({ userId: row.user_id, cents: row.share_cents });
    sharesByExpense.set(row.expense_id, list);
  }
  const memberIds = people.map((person) => person.userId);

  const expenses = expenseResult.rows.map((row) => {
    let shares = sharesByExpense.get(row.id);
    if (!shares) {
      // Expenses saved before splits existed count as split equally.
      const split = computeSplit(row.amount_cents, "equal", memberIds, {});
      shares = split.ok ? split.shares : [];
    }
    return {
      id: row.id,
      title: row.title,
      amountCents: row.amount_cents,
      paidBy: row.paid_by,
      category: row.category,
      spentOn: row.spent_on,
      splitType: row.split_type,
      addedBy: row.added_by,
      shares,
    };
  });
  const settlements = settlementResult.rows.map((row) => ({
    id: row.id,
    fromUser: row.from_user,
    toUser: row.to_user,
    amountCents: row.amount_cents,
    addedBy: row.added_by,
    createdOn: row.created_on,
  }));

  // People who left the trip can still be on old expenses, so look up every name.
  const ids = new Set<string>(memberIds);
  for (const expense of expenses) {
    ids.add(expense.paidBy);
    for (const share of expense.shares) ids.add(share.userId);
  }
  for (const settlement of settlements) {
    ids.add(settlement.fromUser);
    ids.add(settlement.toUser);
  }
  const names: Record<string, string> = {};
  if (ids.size > 0) {
    const nameResult = await db.execute<{ id: string; name: string }>(sql`
      SELECT id::text AS id, name FROM neon_auth."user"
      WHERE id::text IN (${sql.join([...ids].map((id) => sql`${id}`), sql`, `)})
    `);
    for (const row of nameResult.rows) names[row.id] = row.name;
  }

  return {
    currency: currencyRow[0]?.currency ?? "INR",
    expenses,
    settlements,
    names,
  };
}

export async function addExpense(actorId: string, tripId: string, input: ExpenseInput) {
  await requireMember(actorId, tripId);
  const members = new Set((await listTripPeople(tripId)).map((person) => person.userId));
  if (!members.has(input.paidBy)) {
    throw new Error("Choose someone on the trip as the payer.");
  }
  if (input.participants.some((id) => !members.has(id))) {
    throw new Error("Only people on the trip can split an expense.");
  }

  const amountCents = toCents(input.amount);
  const split = computeSplit(amountCents, input.splitType, input.participants, input.values);
  if (!split.ok) {
    throw new Error(split.error);
  }
  const shares = split.shares.filter((share) => share.cents > 0);

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(tripExpense)
      .values({
        tripId,
        title: input.title,
        amountCents,
        paidBy: input.paidBy,
        category: input.category,
        spentOn: input.spentOn,
        splitType: input.splitType,
        addedBy: actorId,
      })
      .returning({ id: tripExpense.id });
    if (!row) throw new Error("The expense was not saved.");
    await tx
      .insert(tripExpenseShare)
      .values(shares.map((share) => ({ expenseId: row.id, userId: share.userId, shareCents: share.cents })));
  });
}

export async function deleteExpense(actorId: string, tripId: string, expenseId: string) {
  await requireMember(actorId, tripId);
  await db
    .delete(tripExpense)
    .where(and(eq(tripExpense.id, expenseId), eq(tripExpense.tripId, tripId)));
}

export async function addSettlement(actorId: string, tripId: string, input: SettlementInput) {
  await requireMember(actorId, tripId);
  if (input.fromUser === input.toUser) {
    throw new Error("Choose two different people.");
  }
  const amountCents = toCents(input.amount);
  if (amountCents <= 0) {
    throw new Error("Enter an amount above zero.");
  }
  const ledger = await getTripLedger(tripId);
  const known = new Set(Object.keys(ledger.names));
  if (!known.has(input.fromUser) || !known.has(input.toUser)) {
    throw new Error("Choose people from this trip.");
  }
  await db.insert(tripSettlement).values({
    tripId,
    fromUser: input.fromUser,
    toUser: input.toUser,
    amountCents,
    addedBy: actorId,
  });
}

export async function deleteSettlement(actorId: string, tripId: string, settlementId: string) {
  await requireMember(actorId, tripId);
  await db
    .delete(tripSettlement)
    .where(and(eq(tripSettlement.id, settlementId), eq(tripSettlement.tripId, tripId)));
}

export async function setTripCurrency(actorId: string, tripId: string, currency: string) {
  await requireMember(actorId, tripId);
  if (!(currency in currencies)) {
    throw new Error("Choose a currency from the list.");
  }
  await db.update(trip).set({ currency }).where(eq(trip.id, tripId));
}
