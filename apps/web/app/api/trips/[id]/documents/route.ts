import { addDocument, getTripForMember } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "text/plain": "txt",
};

const maxBytes = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  const trip = await getTripForMember(session.user.id, id);
  if (!trip) {
    return Response.json({ error: "You are not on this trip." }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file." }, { status: 400 });
  }
  const extension = types[file.type];
  if (!extension) {
    return Response.json(
      { error: "Use a PDF, image, or text file." },
      { status: 400 },
    );
  }
  if (file.size > maxBytes) {
    return Response.json({ error: "Keep the file under 5 MB." }, { status: 400 });
  }

  const key = `trips/${id}/${crypto.randomUUID()}.${extension}`;
  await files.upload(key, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
  });
  await addDocument(session.user.id, id, {
    name: file.name || "Document",
    objectKey: key,
    contentType: file.type,
  });

  return Response.json({ ok: true });
}
