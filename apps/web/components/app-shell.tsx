import { getProfile } from "@travel-buddy/db";
import { AppBanner } from "@/components/app-banner";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function AppShell({
  children,
  query = "",
}: {
  children: React.ReactNode;
  query?: string;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  const profile = await getProfile(session.user.id);

  return (
    <div className="flex flex-1 flex-col">
      <AppBanner
        name={session.user.name}
        hasPhoto={Boolean(profile.avatarKey)}
        version={profile.updatedAt.toISOString()}
        query={query}
      />
      {children}
    </div>
  );
}
