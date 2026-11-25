import { getProfile, listPersonalDocuments } from "@travel-buddy/db";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth/server";
import { formatDay } from "@/lib/format-day";
import { redirect } from "next/navigation";
import { PersonalDocuments } from "./personal-documents";
import { ProfileForm } from "./profile-form";
import { ProfilePhoto } from "./profile-photo";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const [row, documents] = await Promise.all([
    getProfile(session.user.id),
    listPersonalDocuments(session.user.id),
  ]);

  return (
    <AppShell>
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-card shadow-sm dark:border-stone-800">
        <div className="flex h-28 items-start justify-between bg-stone-900 px-6 py-4 text-stone-100 sm:px-8 dark:bg-stone-800">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-300">Traveller · Travel Buddy</p>
        </div>
        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-12">
            <ProfilePhoto
              name={session.user.name}
              hasPhoto={Boolean(row.avatarKey)}
              version={row.updatedAt.toISOString()}
            />
          </div>
          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight">
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

      <PersonalDocuments
        documents={documents.map((document) => ({
          id: document.id,
          name: document.name,
          category: document.category,
          createdAt: formatDay(document.createdAt.toISOString()),
        }))}
      />
    </main>
    </AppShell>
  );
}
