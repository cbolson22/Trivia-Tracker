"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "./page";

export function VenueList({ groupId, venues }: { groupId: string; venues: Venue[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return venues;
    return venues.filter(
      (v) => v.name.toLowerCase().includes(query) || (v.address ?? "").toLowerCase().includes(query)
    );
  }, [venues, search]);

  async function handleDelete(venueId: string) {
    if (
      !window.confirm(
        "Delete this venue? Entries linked to it will keep their other details but lose the venue link."
      )
    )
      return;

    const supabase = createClient();
    await supabase.from("venues").delete().eq("id", venueId);
    router.refresh();
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search venues"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      <div className="mt-4 flex gap-3">
        <Link
          href={`/groups/${groupId}/venues/new`}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-indigo-700"
        >
          Add venue
        </Link>
        <Link
          href={`/groups/${groupId}/map`}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          View map
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500">No venues yet.</p>
        )}

        {filtered.map((venue) => (
          <li key={venue.id} className="rounded-lg border border-gray-300 bg-white px-4 py-3">
            <p className="font-medium text-gray-900">{venue.name}</p>
            {venue.address && <p className="mt-1 text-sm text-gray-500">{venue.address}</p>}

            <div className="mt-3 flex gap-3 text-sm">
              <Link
                href={`/groups/${groupId}/venues/${venue.id}/edit`}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(venue.id)}
                className="font-medium text-red-600 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
