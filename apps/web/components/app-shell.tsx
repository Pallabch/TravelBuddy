import { getProfile } from "@travel-buddy/db";
import { AppBanner } from "@/components/app-banner";
import { BannerSkeleton } from "@/components/skeleton";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export function AppShell({
  children,
  query = "",
}: {
  children: React.ReactNode;
  query?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<BannerSkeleton />}>
        <AppBannerFromSession query={query} />
      </Suspense>
      <div className="flex flex-1 flex-col animate-page-in">{children}</div>
    </div>
  );
}

async function AppBannerFromSession({ query }: { query: string }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const profile = await getProfile(session.user.id);

  return (
    <AppBanner
      name={session.user.name}
      hasPhoto={Boolean(profile.avatarKey)}
      version={profile.updatedAt.toISOString()}
      query={query}
    />
  );
}
