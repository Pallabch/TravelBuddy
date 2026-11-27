"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ThemedSelect } from "@/components/themed-select";
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
  updateExpenseAction,
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
  solo,
}: {
  tripId: string;
  ledger: Ledger;
  people: Person[];
  currentUserId: string;
  today: string;
  solo: boolean;
}) {
  const [adding, setAdding] = useState(ledger.expenses.length === 0);
  const [section, setSection] = useState<"expenses" | "payments">("expenses");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [currency, setOptimisticCurrency] = useOptimistic(ledger.currency);
  const money = (cents: number) => formatMoney(cents, currency);
  const name = (id: string) =>
    id === currentUserId ? "You" : (ledger.names[id] ?? "Former member");

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
  const paidByPerson = new Map<string, number>();
  const shareByPerson = new Map<string, number>();
  for (const person of people) {
    paidByPerson.set(person.userId, 0);
    shareByPerson.set(person.userId, 0);
  }
  for (const expense of ledger.expenses) {
    paidByPerson.set(expense.paidBy, (paidByPerson.get(expense.paidBy) ?? 0) + expense.amountCents);
    for (const share of expense.shares) {
      shareByPerson.set(share.userId, (shareByPerson.get(share.userId) ?? 0) + share.cents);
    }
  }
  const spenders = [...paidByPerson.entries()].sort(
    (a, b) => b[1] - a[1] || name(a[0]).localeCompare(name(b[0])),
  );
  const mostPaid = Math.max(1, ...spenders.map(([, cents]) => cents));
  const youPaid = paidByPerson.get(currentUserId) ?? 0;
  const visibleExpenses = [...ledger.expenses]
    .filter((expense) => categoryFilter === "all" || expense.category === categoryFilter)
    .filter((expense) => payerFilter === "all" || expense.paidBy === payerFilter)
    .sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.title.localeCompare(a.title));
  const recorded = [...ledger.settlements].sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...[...byCategory.keys()].sort((a, b) => a.localeCompare(b)).map((category) => ({
      value: category,
      label: category,
    })),
  ];
  const payerOptions = [
    { value: "all", label: "Everyone" },
    { value: currentUserId, label: "Your expenses" },
    ...people
      .filter((person) => person.userId !== currentUserId)
      .map((person) => ({ value: person.userId, label: person.name })),
  ];
  const initial = (id: string) => {
    const source = ledger.names[id] ?? name(id);
    return source.trim().charAt(0).toUpperCase() || "?";
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-tight">Expenses</h3>
          <p className="mt-1 text-sm text-stone-500">
            {solo
              ? "Add what you paid for. The totals stay with this trip."
              : "Add what you paid for. Shares, balances, and payments stay with the trip."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setAdding((value) => !value)} className={primary}>
            {adding ? "Close" : "Add expense"}
          </button>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            Currency
            <span className="w-28">
              <ThemedSelect
                value={currency}
                disabled={pending}
                options={Object.keys(currencies).map((code) => ({ value: code, label: code }))}
                onChange={(next) => {
                  startTransition(async () => {
                    setOptimisticCurrency(next);
                    await setCurrencyAction(tripId, next);
                  });
                }}
              />
            </span>
          </label>
        </div>
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
          <p className="mt-1 text-2xl font-semibold tabular-nums">{money(total)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {ledger.expenses.length === 1 ? "1 expense" : `${ledger.expenses.length} expenses`}
          </p>
        </div>
        <div className={card}>
          <p className="field-label">You paid</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{money(youPaid)}</p>
          <p className="mt-1 text-xs text-stone-500">Your share of the trip is {money(myShare)}</p>
        </div>
        <div className={card}>
          <p className="field-label">Your balance</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              myBalance > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : myBalance < 0
                  ? "text-red-700 dark:text-red-400"
                  : ""
            }`}
          >
            {myBalance > 0 ? money(myBalance) : myBalance < 0 ? money(-myBalance) : money(0)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {myBalance > 0 ? "You are owed this" : myBalance < 0 ? "You owe this" : "You are settled"}
          </p>
        </div>
      </div>

      <section className={card}>
        <h3 className="text-sm font-semibold">Who spent what</h3>
        <p className="mt-1 text-xs text-stone-500">Money each person paid, and their share of those costs.</p>
        <ul className="mt-4 grid gap-4">
          {spenders.map(([userId, cents]) => (
            <li key={userId}>
              <div className="flex items-center gap-3">
                <PersonMark letter={initial(userId)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium">{name(userId)}</p>
                    <p className="text-sm font-semibold tabular-nums">{money(cents)}</p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className={`h-2 rounded-full ${userId === currentUserId ? "bg-stamp" : "bg-stone-900 dark:bg-stone-100"}`}
                      style={{ width: `${cents === 0 ? 0 : Math.max(6, (cents / mostPaid) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Share {money(shareByPerson.get(userId) ?? 0)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h3 className="text-sm font-semibold">To settle</h3>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">{solo ? "Nothing to settle." : "Everyone is even."}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {payments.map((payment) => (
              <li
                key={`${payment.fromUser}-${payment.toUser}`}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-stone-50 px-3 py-3 dark:bg-stone-900"
              >
                <PersonMark letter={initial(payment.fromUser)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{name(payment.fromUser)}</span>
                    <span className="text-stone-400"> → </span>
                    <span className="font-medium">{name(payment.toUser)}</span>
                  </p>
                  <p className="text-xs text-stone-500">Suggested from the balances</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{money(payment.amountCents)}</p>
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
                      setSection("payments");
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
      </section>

      {categoryTotals.length > 0 ? (
        <section className={card}>
          <h3 className="text-sm font-semibold">By category</h3>
          <ul className="mt-3 grid gap-3">
            {categoryTotals.map(([category, cents]) => (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => {
                    setSection("expenses");
                    setCategoryFilter(category);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="stamp-tag">{category}</span>
                    <span className="text-sm tabular-nums text-stone-500">{money(cents)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-1.5 rounded-full bg-stamp"
                      style={{ width: `${Math.max(4, (cents / total) * 100)}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        role="tablist"
        aria-label="Expense records"
        className="flex w-full rounded-full border border-stone-300 bg-stone-100 p-1 sm:w-fit dark:border-stone-700 dark:bg-stone-900"
      >
        {(
          [
            { id: "expenses" as const, label: "Expenses", count: ledger.expenses.length },
            { id: "payments" as const, label: "Recorded payments", count: ledger.settlements.length },
          ]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={section === tab.id}
            onClick={() => setSection(tab.id)}
            className={
              section === tab.id
                ? "min-h-11 flex-1 rounded-full bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white sm:flex-none dark:bg-stone-100 dark:text-stone-900"
                : "min-h-11 flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 sm:flex-none dark:text-stone-300"
            }
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {section === "expenses" ? (
        <section className="grid gap-3">
          {ledger.expenses.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Category
                <ThemedSelect
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                />
              </label>
              {solo ? null : (
                <label className="grid gap-1 text-sm">
                  Paid by
                  <ThemedSelect value={payerFilter} options={payerOptions} onChange={setPayerFilter} />
                </label>
              )}
            </div>
          ) : null}
          {ledger.expenses.length === 0 ? (
            <p className="text-sm text-stone-500">No expenses yet. Add one you paid for.</p>
          ) : visibleExpenses.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-stone-500">Nothing matches these filters.</p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setPayerFilter("all");
                }}
                className={secondary}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-3">
              {visibleExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  tripId={tripId}
                  expense={expense}
                  currentUserId={currentUserId}
                  name={name}
                  money={money}
                  people={people}
                  currency={currency}
                  initial={initial}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="grid gap-3">
          <p className="text-sm text-stone-500">
            {solo
              ? "Payments you record, separate from the cost of an item."
              : "Money one person paid another. Item costs stay under Expenses."}
          </p>
          {recorded.length === 0 ? (
            <p className="text-sm text-stone-500">No payments recorded yet.</p>
          ) : (
            <ul className="grid gap-3">
              {recorded.map((settlement) => (
                <li key={settlement.id} className={`${card} flex items-center gap-3`}>
                  <PersonMark letter={initial(settlement.fromUser)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{name(settlement.fromUser)}</span>
                      <span className="text-stone-400"> → </span>
                      <span className="font-medium">{name(settlement.toUser)}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">{formatDay(settlement.createdOn)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{money(settlement.amountCents)}</p>
                  <Remove
                    label="Delete payment"
                    action={() => deleteSettlementAction(tripId, settlement.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          <PaymentForm tripId={tripId} people={people} currentUserId={currentUserId} />
        </section>
      )}
    </div>
  );
}

function PersonMark({ letter }: { letter: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-stamp-soft text-sm font-semibold text-stamp">
      {letter}
    </span>
  );
}
function ExpenseRow({
  tripId,
  expense,
  currentUserId,
  name,
  money,
  people,
  currency,
  initial,
}: {
  tripId: string;
  expense: Ledger["expenses"][number];
  currentUserId: string;
  name: (id: string) => string;
  money: (cents: number) => string;
  people: Person[];
  currency: string;
  initial: (id: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = expense.shares.find((share) => share.userId === currentUserId)?.cents ?? 0;
  let note = { text: "You are not on this one", tone: "text-stone-500" };
  if (expense.paidBy === currentUserId && expense.amountCents - mine > 0) {
    note = { text: `You lent ${money(expense.amountCents - mine)}`, tone: "text-emerald-700 dark:text-emerald-400" };
  } else if (expense.paidBy !== currentUserId && mine > 0) {
    note = { text: `Your share is ${money(mine)}`, tone: "text-red-700 dark:text-red-400" };
  } else if (expense.paidBy === currentUserId) {
    note = { text: "Only you", tone: "text-stone-500" };
  }

  if (editing) {
    return (
      <li>
        <ExpenseForm
          tripId={tripId}
          people={people}
          currentUserId={currentUserId}
          currency={currency}
          today={expense.spentOn}
          expense={expense}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={card}>
      <div className="flex items-start gap-3">
        <DateBadge value={expense.spentOn} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-medium">{expense.title}</p>
            <p className="text-sm font-semibold tabular-nums">{money(expense.amountCents)}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="stamp-tag">{expense.category}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
              <PersonMark letter={initial(expense.paidBy)} />
              <span>{name(expense.paidBy)} paid</span>
            </span>
          </div>
          <p className={`mt-2 text-xs ${note.tone}`}>{note.text}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="text-sm text-stone-500"
        >
          {open ? "Hide split" : "Show split"}
        </button>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(true)} className={secondary}>
            Edit
          </button>
          <Remove label={`Delete ${expense.title}`} action={() => deleteExpenseAction(tripId, expense.id)} />
        </span>
      </div>
      {open ? (
        <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-900">
          <p className="text-xs text-stone-500">
            Split {expense.splitType === "equal" ? "equally" : `by ${splitLabels[expense.splitType].toLowerCase()}`}
            {expense.addedBy
              ? ` · added by ${expense.addedBy === currentUserId ? "you" : name(expense.addedBy)}`
              : ""}
          </p>
          <ul className="mt-2 grid gap-2">
            {expense.shares.map((share) => (
              <li key={share.userId} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <PersonMark letter={initial(share.userId)} />
                  <span>{name(share.userId)}</span>
                </span>
                <span className="tabular-nums">{money(share.cents)}</span>
              </li>
            ))}
          </ul>
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

function Remove({ label, action }: { label: string; action: () => Promise<{ error?: string }> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <span
      className={
        confirming
          ? "inline-grid grid-cols-[auto_1fr] items-center rounded-lg bg-red-50 transition-[grid-template-columns,background-color] duration-200 ease-out dark:bg-red-950/50"
          : "inline-grid grid-cols-[auto_0fr] items-center rounded-lg transition-[grid-template-columns,background-color] duration-200 ease-out"
      }
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={confirming}
        onClick={() => setConfirming(true)}
        className={
          confirming
            ? "grid size-8 place-items-center text-red-700 dark:text-red-400"
            : "grid size-8 place-items-center text-stone-400 hover:text-red-700 dark:hover:text-red-400"
        }
      >
        <TrashIcon open={confirming} />
      </button>
      <span className="overflow-hidden" inert={confirming ? undefined : true} aria-hidden={!confirming}>
        <span className="flex items-center gap-1 pr-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await action()))}
            className="rounded-md bg-red-700 px-2 py-1 text-xs font-medium whitespace-nowrap text-white disabled:opacity-60"
          >
            {pending ? "Deleting" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md px-2 py-1 text-xs whitespace-nowrap text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-stone-900"
          >
            Cancel
          </button>
        </span>
      </span>
    </span>
  );
}

function TrashIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <g
        className={
          open
            ? "origin-[4px_7px] -rotate-[24deg] transition-transform duration-200 ease-out"
            : "origin-[4px_7px] transition-transform duration-200 ease-out"
        }
      >
        <path
          d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path d="M4 7h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </g>
      <path
        d="M6.5 9.2 7.4 19a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4l.9-9.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 12.2v5.2M14 12.2v5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
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
        Record a payment
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
        <ThemedSelect
          name="fromUser"
          defaultValue={currentUserId}
          options={people.map((person) => ({
            value: person.userId,
            label: person.userId === currentUserId ? "You" : person.name,
          }))}
        />
      </label>
      <label className="grid gap-1 text-sm">
        To
        <ThemedSelect
          name="toUser"
          defaultValue={other}
          options={people.map((person) => ({
            value: person.userId,
            label: person.userId === currentUserId ? "You" : person.name,
          }))}
        />
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

function centsToAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function valuesFromExpense(expense: Ledger["expenses"][number]) {
  if (expense.splitType === "equal") return {};
  if (expense.splitType === "exact") {
    return Object.fromEntries(expense.shares.map((share) => [share.userId, centsToAmount(share.cents)]));
  }
  if (expense.splitType === "percent") {
    const total = expense.amountCents || 1;
    return Object.fromEntries(
      expense.shares.map((share) => [share.userId, String(Math.round((share.cents / total) * 1000) / 10)]),
    );
  }
  return Object.fromEntries(expense.shares.map((share) => [share.userId, String(Math.max(1, share.cents))]));
}

function ExpenseForm({
  tripId,
  people,
  currentUserId,
  currency,
  today,
  expense,
  onSaved,
  onCancel,
}: {
  tripId: string;
  people: Person[];
  currentUserId: string;
  currency: string;
  today: string;
  expense?: Ledger["expenses"][number];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [amount, setAmount] = useState(expense ? centsToAmount(expense.amountCents) : "");
  const [splitType, setSplitType] = useState<SplitType>(expense?.splitType ?? "equal");
  const [included, setIncluded] = useState(
    () => new Set(expense ? expense.shares.map((share) => share.userId) : people.map((person) => person.userId)),
  );
  const [values, setValues] = useState<Record<string, string>>(() => (expense ? valuesFromExpense(expense) : {}));
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
          const result = expense
            ? await updateExpenseAction(tripId, expense.id, formData)
            : await addExpenseAction(tripId, formData);
          setError(result.error ?? null);
          if (!result.error) onSaved();
        })
      }
      className={`${card} grid gap-4`}
    >
      {expense ? <p className="text-sm font-medium">Edit expense</p> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="grid gap-1 text-sm">
          What was it for
          <input
            name="title"
            required
            maxLength={80}
            placeholder="Dinner at Ramiro"
            defaultValue={expense?.title}
            className={field}
          />
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
          <ThemedSelect
            name="category"
            editable
            defaultValue={expense?.category ?? "General"}
            options={categories.map((category) => ({ value: category, label: category }))}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input name="spentOn" type="date" required defaultValue={expense?.spentOn ?? today} className={field} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Paid by
          <ThemedSelect
            name="paidBy"
            defaultValue={expense?.paidBy ?? currentUserId}
            options={people.map((person) => ({
              value: person.userId,
              label: person.userId === currentUserId ? "You" : person.name,
            }))}
          />
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

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending || (preview !== null && !preview.ok)} className={primary}>
          {pending ? "Saving" : expense ? "Save changes" : "Save expense"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={secondary}>
            Cancel
          </button>
        ) : null}
        {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

