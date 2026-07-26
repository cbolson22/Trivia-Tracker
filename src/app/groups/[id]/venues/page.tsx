import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VenueList } from "./VenueList";

export type Venue = {
  id: string;
  group_id: string;
  name: string;
  address: string | null;
  longitude: number;
  latitude: number;
  created_at: string;
};

export default async function VenuesPage({
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
    .select("id, group_id, name, address, longitude, latitude, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {group.name}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">Venues</p>

        <VenueList groupId={id} venues={(venues ?? []) as Venue[]} />

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href={`/groups/${id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to group
          </Link>
        </p>
      </div>
    </main>
  );
}
