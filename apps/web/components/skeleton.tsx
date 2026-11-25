export function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-skeleton rounded-lg bg-stone-200/80 dark:bg-stone-800/80 ${className}`} />;
}

export function BannerSkeleton() {
  return (
    <div className="sticky top-0 z-30 border-b-2 border-dashed border-stone-300/80 bg-[var(--background)]/90 dark:border-stone-700/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Bone className="h-8 w-9 rounded-full sm:w-36" />
        <Bone className="hidden h-9 w-40 rounded-full sm:block" />
        <div className="ml-auto flex items-center gap-2">
          <Bone className="hidden h-8 w-24 rounded-full sm:block" />
          <Bone className="size-9 rounded-full" />
          <Bone className="size-9 rounded-full" />
          <Bone className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 animate-page-in px-6 py-12">
      <Bone className="h-3 w-24" />
      <Bone className="mt-3 h-10 w-48" />
      <Bone className="mt-10 h-3 w-20" />
      <Bone className="mt-3 h-40 w-full rounded-2xl" />
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
      </div>
    </main>
  );
}

export function TripsSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 animate-page-in flex-col px-6 py-10">
      <Bone className="h-3 w-24" />
      <Bone className="mt-3 h-10 w-40" />
      <Bone className="mt-2 h-4 w-72" />
      <Bone className="mt-8 h-3 w-28" />
      <div className="mt-3 grid gap-4">
        <Bone className="h-36 rounded-2xl" />
        <Bone className="h-36 rounded-2xl" />
      </div>
      <Bone className="mt-12 h-56 rounded-2xl" />
    </main>
  );
}

export function TripDetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 animate-page-in px-4 py-6 sm:px-6 sm:py-8">
      <Bone className="h-4 w-20" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
          <Bone className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Bone className="h-3 w-28" />
            <Bone className="h-8 w-40" />
            <Bone className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Bone className="h-10" />
              <Bone className="h-10" />
              <Bone className="h-10" />
              <Bone className="h-10" />
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-5">
          <div className="flex gap-2 overflow-hidden">
            <Bone className="h-9 w-24 rounded-full" />
            <Bone className="h-9 w-20 rounded-full" />
            <Bone className="h-9 w-28 rounded-full" />
            <Bone className="h-9 w-24 rounded-full" />
          </div>
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-72" />
          <Bone className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 animate-page-in flex-col px-6 py-10">
      <div className="overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800">
        <Bone className="h-28 w-full rounded-none" />
        <div className="px-6 pb-8 sm:px-8">
          <Bone className="-mt-12 size-24 rounded-full" />
          <Bone className="mt-5 h-10 w-56" />
          <Bone className="mt-2 h-4 w-64" />
          <div className="mt-8 space-y-4">
            <Bone className="h-12 w-full" />
            <Bone className="h-12 w-full" />
            <Bone className="h-24 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function SearchSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 animate-page-in px-6 py-12">
      <Bone className="h-10 w-40" />
      <Bone className="mt-2 h-4 w-56" />
      <div className="mt-8 space-y-3">
        <Bone className="h-14 w-full rounded-xl" />
        <Bone className="h-14 w-full rounded-xl" />
        <Bone className="h-14 w-full rounded-xl" />
      </div>
    </main>
  );
}

export function AppPageSkeleton({
  variant = "trips",
}: {
  variant?: "home" | "trips" | "trip" | "profile" | "search";
}) {
  return (
    <div className="flex flex-1 flex-col">
      <BannerSkeleton />
      {variant === "home" ? <HomeSkeleton /> : null}
      {variant === "trips" ? <TripsSkeleton /> : null}
      {variant === "trip" ? <TripDetailSkeleton /> : null}
      {variant === "profile" ? <ProfileSkeleton /> : null}
      {variant === "search" ? <SearchSkeleton /> : null}
    </div>
  );
}
