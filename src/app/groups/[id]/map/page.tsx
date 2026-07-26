import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VenueMap } from "./VenueMap";

export type MapVenue = {
  id: string;
  name: string;
  address: string | null;
  longitude: number;
  latitude: number;
};

export default async function GroupMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, address, longitude, latitude")
    .eq("group_id", id);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {group.name}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">Map</p>

        <VenueMap groupId={id} venues={(venues ?? []) as MapVenue[]} />

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href={`/groups/${id}/venues`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to venues
          </Link>
        </p>
      </div>
    </main>
  );
}
