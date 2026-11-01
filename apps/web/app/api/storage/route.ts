import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = `checks/${session.user.id}/${crypto.randomUUID()}.txt`;
  const body = "travel-buddy";

  await files.upload(key, body, { contentType: "text/plain" });
  const downloaded = await files.download(key);
  const text = await downloaded.text();
  await files.delete(key);

  return Response.json({ match: text === body });
}
