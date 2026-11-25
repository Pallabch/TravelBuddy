import { PendingLink } from "@/components/pending-link";
import { formatDay } from "@/lib/format-day";

export type PassTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverKey: string | null;
  role: string;
};

export function BoardingPass({ trip, href }: { trip: PassTrip; href?: string }) {
  const days = dayCount(trip.startDate, trip.endDate);
  const body = (
    <div className="flex w-full">
      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="field-label">Boarding pass</p>
          <span className="stamp-tag -rotate-3">{trip.role}</span>
        </div>
        <h3 className="mt-2 truncate font-serif text-2xl font-semibold tracking-tight">
          {trip.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-stone-600 dark:text-stone-400">
          <PinIcon />
          {trip.destination}
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <Field label="Depart" value={formatDay(trip.startDate)} />
          <Field label="Return" value={formatDay(trip.endDate)} />
          <Field label="Days" value={String(days)} />
        </dl>
      </div>
      <div className="perforation-y hidden w-36 shrink-0 flex-col items-center justify-center gap-2 p-4 @lg:flex">
        {trip.coverKey ? (
          // A trip cover served from our API after a membership check.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/trips/${trip.id}/photo?v=${trip.coverKey.split("/").pop()}`}
            alt=""
            className="size-24 rounded-xl object-cover"
          />
        ) : (
          <>
            <p className="font-mono text-3xl font-semibold tracking-widest">
              {code(trip.destination)}
            </p>
            <Barcode seed={trip.id} />
          </>
        )}
      </div>
    </div>
  );

  const className =
    "@container flex overflow-hidden rounded-2xl border border-stone-200 bg-card shadow-sm transition dark:border-stone-800";
  if (!href) return <div className={className}>{body}</div>;
  return (
    <PendingLink
      href={href}
      className={`${className} hover:-translate-y-0.5 hover:shadow-md`}
    >
      {body}
    </PendingLink>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="field-label">{label}</dt>
      <dd className="mt-0.5 whitespace-nowrap font-mono text-sm font-medium">{value}</dd>
    </div>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 fill-none stroke-current stroke-2">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// Decorative only: bar widths come from the trip id so each pass looks different.
function Barcode({ seed }: { seed: string }) {
  const digits = seed.replace(/[^0-9a-f]/gi, "").slice(0, 18);
  return (
    <div aria-hidden="true" className="flex h-8 items-stretch gap-[2px]">
      {[...digits].map((char, index) => (
        <span
          key={index}
          className="bg-stone-800 dark:bg-stone-200"
          style={{ width: `${(parseInt(char, 16) % 3) + 1}px` }}
        />
      ))}
    </div>
  );
}

export function code(destination: string) {
  const letters = destination.replace(/[^a-z]/gi, "").toUpperCase();
  return (letters.slice(0, 3) || "TRP").padEnd(3, "X");
}

export function dayCount(start: string, end: string) {
  const toUtc = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  };
  return Math.max(1, Math.round((toUtc(end) - toUtc(start)) / 86_400_000) + 1);
}
