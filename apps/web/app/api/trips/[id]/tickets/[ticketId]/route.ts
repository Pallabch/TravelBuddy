import { getTicketForMember, renameTicket } from "@travel-buddy/db";
import { documentName } from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f-]{36}$/i;

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id, ticketId } = await params;
  if (!uuidPattern.test(id) || !uuidPattern.test(ticketId)) {
    return Response.json({ error: "That ticket was not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = documentName.safeParse(body?.name ?? "");
  if (!name.success) {
    return Response.json(
      { error: name.error.issues[0]?.message ?? "Name the ticket." },
      { status: 400 },
    );
  }
  try {
    await renameTicket(session.user.id, id, ticketId, name.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That ticket was not found.";
    return Response.json({ error: message }, { status: 404 });
  }
  return Response.json({ ok: true });
}
