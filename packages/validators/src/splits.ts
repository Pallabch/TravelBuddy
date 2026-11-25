import { z } from "zod";

export const splitTypes = ["equal", "exact", "percent", "shares"] as const;
export type SplitType = (typeof splitTypes)[number];

export const currencies = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  THB: "฿",
  SGD: "S$",
  AED: "AED ",
  AUD: "A$",
} as const;
export type Currency = keyof typeof currencies;

const amount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 42.50");

export const expenseInput = z.object({
  title: z.string().trim().min(1, "Add what this was for").max(80),
  amount,
  category: z.string().trim().min(1).max(40),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  paidBy: z.string().trim().min(1, "Choose who paid"),
  splitType: z.enum(splitTypes),
  // userId -> the number typed for that person. Ignored for "equal".
  values: z.record(z.string(), z.string().trim()),
  participants: z.array(z.string().trim().min(1)).min(1, "Choose who is splitting this"),
});

export const settlementInput = z.object({
  fromUser: z.string().trim().min(1),
  toUser: z.string().trim().min(1),
  amount,
});

export type ExpenseInput = z.infer<typeof expenseInput>;
export type SettlementInput = z.infer<typeof settlementInput>;

export function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

// Spreads leftover cents one at a time so the shares always add up to the total.
function spread(totalCents: number, weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => (totalCents * weight) / weightSum);
  const cents = raw.map(Math.floor);
  let left = totalCents - cents.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    cents[index] = (cents[index] ?? 0) + 1;
    left -= 1;
  }
  return cents;
}

export type SplitResult =
  | { ok: true; shares: { userId: string; cents: number }[] }
  | { ok: false; error: string };

export function computeSplit(
  totalCents: number,
  splitType: SplitType,
  participants: string[],
  values: Record<string, string>,
): SplitResult {
  const people = [...new Set(participants)];
  if (people.length === 0) return { ok: false, error: "Choose who is splitting this." };
  if (totalCents <= 0) return { ok: false, error: "Enter an amount above zero." };

  if (splitType === "equal") {
    const cents = spread(totalCents, people.map(() => 1));
    return { ok: true, shares: people.map((userId, index) => ({ userId, cents: cents[index]! })) };
  }

  const numbers = people.map((userId) => Number(values[userId] || "0"));
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    return { ok: false, error: "Use positive numbers for each person." };
  }

  if (splitType === "exact") {
    const cents = people.map((userId) => toCents(values[userId] || "0"));
    const sum = cents.reduce((total, value) => total + value, 0);
    if (sum !== totalCents) {
      return {
        ok: false,
        error: `The amounts add up to ${(sum / 100).toFixed(2)}, not ${(totalCents / 100).toFixed(2)}.`,
      };
    }
    return { ok: true, shares: people.map((userId, index) => ({ userId, cents: cents[index]! })) };
  }

  const sum = numbers.reduce((total, value) => total + value, 0);
  if (splitType === "percent" && Math.abs(sum - 100) > 0.001) {
    return { ok: false, error: `The percentages add up to ${round(sum)}%, not 100%.` };
  }
  if (sum <= 0) return { ok: false, error: "Give at least one person a share." };
  const cents = spread(totalCents, numbers);
  return { ok: true, shares: people.map((userId, index) => ({ userId, cents: cents[index]! })) };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

type LedgerExpense = { paidBy: string; amountCents: number; shares: { userId: string; cents: number }[] };
type LedgerSettlement = { fromUser: string; toUser: string; amountCents: number };

// Positive means the group owes this person money; negative means they owe.
export function computeBalances(expenses: LedgerExpense[], settlements: LedgerSettlement[]) {
  const balances = new Map<string, number>();
  const add = (userId: string, cents: number) =>
    balances.set(userId, (balances.get(userId) ?? 0) + cents);
  for (const expense of expenses) {
    add(expense.paidBy, expense.amountCents);
    for (const share of expense.shares) add(share.userId, -share.cents);
  }
  for (const settlement of settlements) {
    add(settlement.fromUser, settlement.amountCents);
    add(settlement.toUser, -settlement.amountCents);
  }
  return balances;
}

// Matches the biggest debtor with the biggest creditor until everyone is even,
// which keeps the number of payments small.
export function simplifyDebts(balances: Map<string, number>) {
  const debtors = [...balances]
    .filter(([, cents]) => cents < 0)
    .map(([userId, cents]) => ({ userId, cents: -cents }))
    .sort((a, b) => b.cents - a.cents);
  const creditors = [...balances]
    .filter(([, cents]) => cents > 0)
    .map(([userId, cents]) => ({ userId, cents }))
    .sort((a, b) => b.cents - a.cents);
  const payments: { fromUser: string; toUser: string; amountCents: number }[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]!;
    const creditor = creditors[c]!;
    const cents = Math.min(debtor.cents, creditor.cents);
    payments.push({ fromUser: debtor.userId, toUser: creditor.userId, amountCents: cents });
    debtor.cents -= cents;
    creditor.cents -= cents;
    if (debtor.cents === 0) d += 1;
    if (creditor.cents === 0) c += 1;
  }
  return payments;
}

export function formatMoney(cents: number, currency: string) {
  const symbol = currencies[currency as Currency] ?? `${currency} `;
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${symbol}${whole}.${String(absolute % 100).padStart(2, "0")}`;
}
