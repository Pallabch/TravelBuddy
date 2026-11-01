import { getTripForMember, listTripPeople } from "@travel-buddy/db";
import { searchPeople } from "@travel-buddy/db";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(
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

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return Response.json({ people: [] });

  const [people, members] = await Promise.all([
    searchPeople(query),
    listTripPeople(id),
  ]);
  const going = new Set(members.map((member) => member.userId));

  return Response.json({
    people: people
      .filter((person) => !going.has(person.id))
      .map((person) => ({
        id: person.id,
        name: person.name,
        homeCity: person.homeCity,
      })),
  });
}
