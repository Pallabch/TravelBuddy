import { getProfile } from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { ProfilePhoto } from "./profile-photo";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const row = await getProfile(session.user.id);

  return (
    <AppShell>
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800">
        <div className="h-28 bg-gradient-to-r from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900" />
        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-12">
            <ProfilePhoto
              name={session.user.name}
              hasPhoto={Boolean(row.avatarKey)}
              version={row.updatedAt.toISOString()}
            />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {session.user.name}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{session.user.email}</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600 dark:text-stone-400">
            Name and email come from your account. The rest is what other
            people on a trip can use to recognize you.
          </p>
          <ProfileForm
            homeCity={row.homeCity}
            bio={row.bio}
            languages={row.languages}
            travelStyle={row.travelStyle}
          />
        </div>
      </section>
    </main>
    </AppShell>
  );
}
