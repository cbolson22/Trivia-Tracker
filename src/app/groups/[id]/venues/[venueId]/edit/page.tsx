import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditVenueForm } from "./EditVenueForm";
import type { Venue } from "../../page";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string; venueId: string }>;
}) {
  const { id: groupId, venueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, group_id, name, address, longitude, latitude, created_at")
    .eq("id", venueId)
    .single();

  if (!venue) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">Edit venue</h1>

        <EditVenueForm venue={venue as Venue} groupId={groupId} />

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href={`/groups/${groupId}/venues`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to venues
          </Link>
        </p>
      </div>
    </main>
  );
}
