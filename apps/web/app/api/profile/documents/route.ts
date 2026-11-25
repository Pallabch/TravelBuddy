import { addPersonalDocument } from "@travel-buddy/db";
import { documentCategory } from "@travel-buddy/validators";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const maxBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file." }, { status: 400 });
  }
  const extension = types[file.type];
  if (!extension) {
    return Response.json({ error: "Use a PDF or an image." }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return Response.json({ error: "Keep the file under 5 MB." }, { status: 400 });
  }
  const category = documentCategory.safeParse(form.get("category") ?? "");
  if (!category.success) {
    return Response.json(
      { error: category.error.issues[0]?.message ?? "Add a category." },
      { status: 400 },
    );
  }

  const key = `users/${session.user.id}/documents/${crypto.randomUUID()}.${extension}`;
  await files.upload(key, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
  });
  await addPersonalDocument(session.user.id, {
    name: file.name || "Document",
    category: category.data,
    objectKey: key,
    contentType: file.type,
  });

  return Response.json({ ok: true });
}
