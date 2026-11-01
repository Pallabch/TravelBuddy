import { pingDatabase } from "@travel-buddy/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await pingDatabase();
  return Response.json({ ok });
}
