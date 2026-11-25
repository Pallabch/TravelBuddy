"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  computeBalances,
  computeSplit,
  currencies,
  formatMoney,
  simplifyDebts,
  toCents,
  type SplitType,
} from "@travel-buddy/validators";
import { formatDay } from "@/lib/format-day";
import {
  addExpenseAction,
  addSettlementAction,
  deleteExpenseAction,
  deleteSettlementAction,
  setCurrencyAction,
} from "./actions";

export type Ledger = {
  currency: string;
  expenses: {
    id: string;
    title: string;
    amountCents: number;
    paidBy: string;
    category: string;
    spentOn: string;
    splitType: SplitType;
    addedBy: string | null;
    shares: { userId: string; cents: number }[];
  }[];
  settlements: {
    id: string;
    fromUser: string;
    toUser: string;
    amountCents: number;
    addedBy: string;
    createdOn: string;
  }[];
  names: Record<string, string>;
};

type Person = { userId: string; name: string };

const categories = [
  "General",
  "Food & drink",
  "Stay",
  "Transport",
  "Activities",
  "Groceries",
  "Shopping",
  "Fees",
];

const splitLabels: Record<SplitType, string> = {
  equal: "Equally",
  exact: "Exact amounts",
  percent: "Percentages",
  shares: "Shares",
};

const field =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";
const primary =
  "whitespace-nowrap rounded-lg bg-stamp px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-stamp-strong disabled:opacity-60 dark:text-stone-950";
const secondary =
  "whitespace-nowrap rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-900";
const card = "rounded-2xl border border-stone-200 bg-card p-4 shadow-sm dark:border-stone-800";

export function TripExpenses({
  tripId,
  ledger,
  people,
  currentUserId,
  today,
}: {
  tripId: string;
  ledger: Ledger;
  people: Person[];
  currentUserId: string;
  today: string;
}) {
  const [adding, setAdding] = useState(ledger.expenses.length === 0);
  const [pending, startTransition] = useTransition();
  const [currency, setOptimisticCurrency] = useOptimistic(ledger.currency);
  const money = (cents: number) => formatMoney(cents, currency);
  const name = (id: string) =>
    id === currentUserId ? "You" : (ledger.names[id] ?? "Former member");
  const object = (id: string) => (id === currentUserId ? "you" : name(id));

  const balances = computeBalances(ledger.expenses, ledger.settlements);
  for (const person of people) {
    if (!balances.has(person.userId)) balances.set(person.userId, 0);
  }
  const payments = simplifyDebts(balances);
  const total = ledger.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const myShare = ledger.expenses.reduce(
    (sum, expense) =>
      sum + (expense.shares.find((share) => share.userId === currentUserId)?.cents ?? 0),
    0,
  );
  const myBalance = balances.get(currentUserId) ?? 0;

  const byCategory = new Map<string, number>();
  for (const expense of ledger.expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountCents);
  }
  const categoryTotals = [...byCategory].sort((a, b) => b[1] - a[1]);

  const activity = [
    ...ledger.expenses.map((expense) => ({ kind: "expense" as const, date: expense.spentOn, expense })),
    ...ledger.settlements.map((settlement) => ({
      kind: "settlement" as const,
      date: settlement.createdOn,
      settlement,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setAdding((value) => !value)} className={primary}>
          {adding ? "Close" : "Add an expense"}
        </button>
        <label className="flex items-center gap-2 text-sm text-stone-500">
          Currency
          <select
            value={currency}
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value;
              startTransition(async () => {
                setOptimisticCurrency(next);
                await setCurrencyAction(tripId, next);
              });
            }}
            className="rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-900 outline-none dark:border-stone-700 dark:text-stone-100"
          >
            {Object.keys(currencies).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>

      {adding ? (
        <ExpenseForm
          tripId={tripId}
          people={people}
          currentUserId={currentUserId}
          currency={currency}
          today={today}
          onSaved={() => setAdding(false)}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}>
          <p className="field-label">Trip total</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{money(total)}</p>
        </div>
        <div className={card}>
          <p className="field-label">Your share</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{money(myShare)}</p>
        </div>
        <div className={card}>
          <p className="field-label">Your balance</p>
          <p
            className={`mt-1 text-xl font-semibold tabular-nums ${
              myBalance > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : myBalance < 0
                  ? "text-red-700 dark:text-red-400"
                  : ""
            }`}
          >
            {myBalance > 0
              ? `You get ${money(myBalance)}`
              : myBalance < 0
                ? `You owe ${money(-myBalance)}`
                : "All settled"}
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold">Settle up</h3>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Everyone is even.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {payments.map((payment) => (
              <li
                key={`${payment.fromUser}-${payment.toUser}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <p className="text-sm">
                  <span className="font-medium">{name(payment.fromUser)}</span>{" "}
                  {payment.fromUser === currentUserId ? "pay" : "pays"}{" "}
                  <span className="font-medium">{object(payment.toUser)}</span>{" "}
                  <span className="tabular-nums">{money(payment.amountCents)}</span>
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await addSettlementAction(tripId, {
                        fromUser: payment.fromUser,
                        toUser: payment.toUser,
                        amount: (payment.amountCents / 100).toFixed(2),
                      });
                    })
                  }
                  className={secondary}
                >
                  Mark as paid
                </button>
              </li>
            ))}
          </ul>
        )}
        <PaymentForm tripId={tripId} people={people} currentUserId={currentUserId} />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Balances</h3>
          <ul className="mt-2 grid gap-2">
            {[...balances]
              .sort((a, b) => b[1] - a[1])
              .map(([userId, cents]) => (
                <li key={userId} className="flex items-center justify-between text-sm">
                  <span>{name(userId)}</span>
                  <span
                    className={`tabular-nums ${
                      cents > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : cents < 0
                          ? "text-red-700 dark:text-red-400"
                          : "text-stone-500"
                    }`}
                  >
                    {cents > 0
                      ? `${userId === currentUserId ? "get" : "gets"} back ${money(cents)}`
                      : cents < 0
                        ? `${userId === currentUserId ? "owe" : "owes"} ${money(-cents)}`
                        : "settled up"}
                  </span>
                </li>
              ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">By category</h3>
          {categoryTotals.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Nothing spent yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {categoryTotals.map(([category, cents]) => (
                <li key={category} className="text-sm">
                  <div className="flex justify-between">
                    <span>{category}</span>
                    <span className="tabular-nums text-stone-500">{money(cents)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-1.5 rounded-full bg-stone-900 dark:bg-stone-100"
                      style={{ width: `${Math.max(4, (cents / total) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h3 className="text-sm font-semibold">Activity</h3>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No expenses yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {activity.map((item) =>
              item.kind === "expense" ? (
                <ExpenseRow
                  key={item.expense.id}
                  tripId={tripId}
                  expense={item.expense}
                  currentUserId={currentUserId}
                  name={name}
                  money={money}
                />
              ) : (
                <li key={item.settlement.id} className="flex items-center gap-3 py-3">
                  <DateBadge value={item.date} />
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{name(item.settlement.fromUser)}</span> paid{" "}
                    <span className="font-medium">{object(item.settlement.toUser)}</span>
                    <span className="block text-xs text-stone-500">Payment</span>
                  </p>
                  <p className="text-sm tabular-nums">{money(item.settlement.amountCents)}</p>
                  <ConfirmDelete
                    label="Delete payment"
                    onConfirm={() => deleteSettlementAction(tripId, item.settlement.id)}
                  />
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function ExpenseRow({
  tripId,
  expense,
  currentUserId,
  name,
  money,
}: {
  tripId: string;
  expense: Ledger["expenses"][number];
  currentUserId: string;
  name: (id: string) => string;
  money: (cents: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const mine = expense.shares.find((share) => share.userId === currentUserId)?.cents ?? 0;
  let note = { text: "not involved", tone: "text-stone-500" };
  if (expense.paidBy === currentUserId && expense.amountCents - mine > 0) {
    note = { text: `you lent ${money(expense.amountCents - mine)}`, tone: "text-emerald-700 dark:text-emerald-400" };
  } else if (expense.paidBy !== currentUserId && mine > 0) {
    note = { text: `you borrowed ${money(mine)}`, tone: "text-red-700 dark:text-red-400" };
  } else if (expense.paidBy === currentUserId) {
    note = { text: "just you", tone: "text-stone-500" };
  }

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <DateBadge value={expense.spentOn} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{expense.title}</span>
          <span className="block text-xs text-stone-500">
            {name(expense.paidBy)} paid · {expense.category}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-sm tabular-nums">{money(expense.amountCents)}</span>
          <span className={`block text-xs ${note.tone}`}>{note.text}</span>
        </span>
      </button>
      {open ? (
        <div className="mt-3 ml-12 rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-900">
          <p className="text-xs text-stone-500">
            Split {expense.splitType === "equal" ? "equally" : `by ${splitLabels[expense.splitType].toLowerCase()}`} on{" "}
            {formatDay(expense.spentOn)}
            {expense.addedBy
              ? ` · added by ${expense.addedBy === currentUserId ? "you" : name(expense.addedBy)}`
              : ""}
          </p>
          <ul className="mt-2 grid gap-1">
            {expense.shares.map((share) => (
              <li key={share.userId} className="flex justify-between">
                <span>{name(share.userId)}</span>
                <span className="tabular-nums">{money(share.cents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <ConfirmDelete
              label="Delete expense"
              onConfirm={() => deleteExpenseAction(tripId, expense.id)}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function DateBadge({ value }: { value: string }) {
  const [day = "", month = ""] = formatDay(value).split(" ");
  return (
    <span className="grid w-9 shrink-0 text-center leading-tight">
      <span className="text-[10px] uppercase text-stone-500">{month}</span>
      <span className="text-base font-semibold">{day}</span>
    </span>
  );
}

function ConfirmDelete({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => Promise<{ error?: string }>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setConfirming(true)}
        className="grid size-6 shrink-0 place-items-center rounded-full text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        ×
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await onConfirm()))}
        className="font-medium text-red-700 dark:text-red-400"
      >
        {pending ? "Deleting" : "Delete"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-stone-500">
        Keep
      </button>
    </span>
  );
}

function PaymentForm({
  tripId,
  people,
  currentUserId,
}: {
  tripId: string;
  people: Person[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const other = people.find((person) => person.userId !== currentUserId)?.userId ?? currentUserId;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-stone-500 underline-offset-4 hover:underline"
      >
        Record a different payment
      </button>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await addSettlementAction(tripId, {
            fromUser: String(formData.get("fromUser")),
            toUser: String(formData.get("toUser")),
            amount: String(formData.get("amount")),
          });
          setError(result.error ?? null);
          if (!result.error) setOpen(false);
        })
      }
      className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end"
    >
      <label className="grid gap-1 text-sm">
        Who paid
        <select name="fromUser" defaultValue={currentUserId} className={field}>
          {people.map((person) => (
            <option key={person.userId} value={person.userId}>
              {person.userId === currentUserId ? "You" : person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        To
        <select name="toUser" defaultValue={other} className={field}>
          {people.map((person) => (
            <option key={person.userId} value={person.userId}>
              {person.userId === currentUserId ? "You" : person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Amount
        <input name="amount" required inputMode="decimal" placeholder="25.00" className={field} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primary}>
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500">
          Cancel
        </button>
      </div>
      {error ? <p className="text-sm text-red-600 sm:col-span-4">{error}</p> : null}
    </form>
  );
}

function ExpenseForm({
  tripId,
  people,
  currentUserId,
  currency,
  today,
  onSaved,
}: {
  tripId: string;
  people: Person[];
  currentUserId: string;
  currency: string;
  today: string;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [included, setIncluded] = useState(() => new Set(people.map((person) => person.userId)));
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const participants = people.map((person) => person.userId).filter((id) => included.has(id));
  const totalCents = /^\d+(\.\d{1,2})?$/.test(amount.trim()) ? toCents(amount) : 0;
  const preview =
    totalCents > 0 ? computeSplit(totalCents, splitType, participants, valuesFor(splitType, values)) : null;
  const shareOf = new Map(preview?.ok ? preview.shares.map((share) => [share.userId, share.cents]) : []);

  function valuesFor(type: SplitType, current: Record<string, string>) {
    if (type !== "shares") return current;
    const filled: Record<string, string> = {};
    for (const id of participants) filled[id] = current[id] ?? "1";
    return filled;
  }

  function toggle(id: string) {
    setIncluded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await addExpenseAction(tripId, formData);
          setError(result.error ?? null);
          if (!result.error) onSaved();
        })
      }
      className={`${card} grid gap-4`}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="grid gap-1 text-sm">
          What was it for
          <input name="title" required maxLength={80} placeholder="Dinner at Ramiro" className={field} />
        </label>
        <label className="grid gap-1 text-sm">
          Amount ({currency})
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="42.50"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={field}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Category
          <input
            name="category"
            list="expense-categories"
            defaultValue="General"
            maxLength={40}
            className={field}
          />
          <datalist id="expense-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input name="spentOn" type="date" required defaultValue={today} className={field} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Paid by
          <select name="paidBy" defaultValue={currentUserId} className={field}>
            {people.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.userId === currentUserId ? "You" : person.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm">Split</legend>
        <input type="hidden" name="splitType" value={splitType} />
        <div className="flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-900">
          {(Object.keys(splitLabels) as SplitType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              aria-pressed={splitType === type}
              className={
                splitType === type
                  ? "rounded-md bg-card px-3 py-1.5 text-sm font-medium shadow-sm dark:bg-stone-700"
                  : "rounded-md px-3 py-1.5 text-sm text-stone-500"
              }
            >
              {splitLabels[type]}
            </button>
          ))}
        </div>
        <ul className="grid gap-2">
          {people.map((person) => {
            const on = included.has(person.userId);
            return (
              <li key={person.userId} className="flex items-center gap-3 text-sm">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    name="participants"
                    value={person.userId}
                    checked={on}
                    onChange={() => toggle(person.userId)}
                  />
                  <span className="truncate">
                    {person.userId === currentUserId ? "You" : person.name}
                  </span>
                </label>
                {splitType !== "equal" && on ? (
                  <span className="flex items-center gap-1">
                    <input
                      name={`value-${person.userId}`}
                      aria-label={`${person.name} ${splitType === "percent" ? "percentage" : splitType === "shares" ? "shares" : "amount"}`}
                      inputMode="decimal"
                      value={values[person.userId] ?? (splitType === "shares" ? "1" : "")}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [person.userId]: event.target.value }))
                      }
                      placeholder={splitType === "exact" ? "0.00" : "0"}
                      className="w-20 rounded-lg border border-stone-300 bg-transparent px-2 py-1 text-right text-sm outline-none dark:border-stone-700"
                    />
                    <span className="w-12 text-xs text-stone-500">
                      {splitType === "percent" ? "%" : splitType === "shares" ? "shares" : currency}
                    </span>
                  </span>
                ) : null}
                <span className="w-24 text-right tabular-nums text-stone-500">
                  {on && shareOf.has(person.userId)
                    ? formatMoney(shareOf.get(person.userId)!, currency)
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
        {preview && !preview.ok ? <p className="text-sm text-amber-700 dark:text-amber-400">{preview.error}</p> : null}
      </fieldset>

      <div>
        <button type="submit" disabled={pending || (preview !== null && !preview.ok)} className={primary}>
          {pending ? "Saving" : "Save expense"}
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}
