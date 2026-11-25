import { deletePersonalDocument, getPersonalDocument } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f-]{36}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const { documentId } = await params;
  if (!uuidPattern.test(documentId)) {
    return new Response(null, { status: 404 });
  }
  const document = await getPersonalDocument(session.user.id, documentId);
  if (!document) {
    return new Response(null, { status: 404 });
  }

  const file = await files.download(document.objectKey);
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Disposition": `inline; filename="${document.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { documentId } = await params;
  if (!uuidPattern.test(documentId)) {
    return Response.json({ error: "That document was not found." }, { status: 404 });
  }
  const objectKey = await deletePersonalDocument(session.user.id, documentId);
  if (!objectKey) {
    return Response.json({ error: "That document was not found." }, { status: 404 });
  }
  try {
    await files.delete(objectKey);
  } catch {
    // The row is gone, so nobody can reach the file anymore.
  }
  return Response.json({ ok: true });
}
