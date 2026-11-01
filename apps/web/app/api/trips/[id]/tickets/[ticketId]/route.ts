import { getTicketForMember } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });

  const { id, ticketId } = await params;
  const ticket = await getTicketForMember(session.user.id, id, ticketId);
  if (!ticket) return new Response(null, { status: 404 });

  const file = await files.download(ticket.objectKey);
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": ticket.contentType,
      "Content-Disposition": `inline; filename="${ticket.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
