import { AppShell } from "@/components/app-shell";
import { Landing } from "@/components/landing";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return <Landing />;
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Travel Buddy</h1>
        <p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-400">
          Travel Buddy is a shared place for a trip and the people coming with
          you. A trip has a name, a destination, and dates, and the person who
          creates it is its owner. Your profile is how the others recognize
          you: a photo, your home city, the languages you speak, and the way
          you like to travel.
        </p>
      </main>
    </AppShell>
  );
}
