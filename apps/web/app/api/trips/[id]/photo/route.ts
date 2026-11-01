import { clearTripCover, getTripForMember, setTripCover } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";
import { files } from "@/lib/storage";

export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const maxBytes = 2 * 1024 * 1024;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });

  const { id } = await params;
  const trip = await getTripForMember(session.user.id, id);
  if (!trip?.coverKey) return new Response(null, { status: 404 });

  const file = await files.download(trip.coverKey);
  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.type || contentType(trip.coverKey),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to add a photo." }, { status: 401 });
  }

  const { id } = await params;
  const trip = await getTripForMember(session.user.id, id);
  if (!trip) {
    return Response.json({ error: "You are not on this trip." }, { status: 404 });
  }

  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return Response.json({ error: "Choose a photo." }, { status: 400 });
  }

  const extension = types[photo.type];
  if (!extension) {
    return Response.json({ error: "Use a JPEG, PNG, or WebP photo." }, { status: 400 });
  }
  if (photo.size > maxBytes) {
    return Response.json({ error: "Keep the photo under 2 MB." }, { status: 400 });
  }

  const key = `trips/${id}/cover/${crypto.randomUUID()}.${extension}`;
  await files.upload(key, new Uint8Array(await photo.arrayBuffer()), {
    contentType: photo.type,
  });

  const previous = await setTripCover(session.user.id, id, key);
  if (previous && previous !== key) {
    try {
      await files.delete(previous);
    } catch {
      // The trip already points at the new photo.
    }
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to remove a photo." }, { status: 401 });
  }

  const { id } = await params;
  const previous = await clearTripCover(session.user.id, id).catch(() => null);
  if (previous === null && !(await getTripForMember(session.user.id, id))) {
    return Response.json({ error: "You are not on this trip." }, { status: 404 });
  }
  if (previous) {
    try {
      await files.delete(previous);
    } catch {
      // The trip no longer points at the photo.
    }
  }
  return Response.json({ ok: true });
}

function contentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
