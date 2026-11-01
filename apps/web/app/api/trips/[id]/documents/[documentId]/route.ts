import { getDocumentForMember } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const { id, documentId } = await params;
  const document = await getDocumentForMember(session.user.id, id, documentId);
  if (!document) {
    return new Response(null, { status: 404 });
  }

  const file = await files.download(document.objectKey);
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Disposition": `inline; filename="${document.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
