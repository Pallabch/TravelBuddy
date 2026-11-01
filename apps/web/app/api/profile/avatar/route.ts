import { getProfile, setAvatarKey } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const maxBytes = 2 * 1024 * 1024;

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const row = await getProfile(session.user.id);
  if (!row.avatarKey) {
    return new Response(null, { status: 404 });
  }

  const file = await files.download(row.avatarKey);
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.type || contentType(row.avatarKey),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to add a photo." }, { status: 401 });
  }

  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return Response.json({ error: "Choose a photo." }, { status: 400 });
  }

  const extension = types[photo.type];
  if (!extension) {
    return Response.json(
      { error: "Use a JPEG, PNG, or WebP photo." },
      { status: 400 },
    );
  }
  if (photo.size > maxBytes) {
    return Response.json(
      { error: "Keep the photo under 2 MB." },
      { status: 400 },
    );
  }

  const key = `avatars/${session.user.id}/${crypto.randomUUID()}.${extension}`;
  await files.upload(key, new Uint8Array(await photo.arrayBuffer()), {
    contentType: photo.type,
  });

  const previous = await setAvatarKey(session.user.id, key);
  if (previous && previous !== key) {
    try {
      await files.delete(previous);
    } catch {
      // The profile already points at the new photo.
    }
  }

  return Response.json({ ok: true });
}

function contentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
