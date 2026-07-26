"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VenueLocationPicker, type VenueLocationPickerHandle } from "../../VenueLocationPicker";
import { VenueNameInput, type VenueSuggestion } from "../../VenueNameInput";
import type { Venue } from "../../page";

export function EditVenueForm({ venue, groupId }: { venue: Venue; groupId: string }) {
  const router = useRouter();
  const pickerRef = useRef<VenueLocationPickerHandle>(null);
  const [name, setName] = useState(venue.name);
  const [address, setAddress] = useState(venue.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSelectSuggestion(suggestion: VenueSuggestion) {
    setName(suggestion.name);
    setAddress(suggestion.address);
    pickerRef.current?.flyTo(suggestion.longitude, suggestion.latitude);
  }

  function handleSelectAddressSuggestion(suggestion: VenueSuggestion) {
    setAddress(suggestion.address);
    if (!name.trim() && suggestion.name) {
      setName(suggestion.name);
    }
    pickerRef.current?.flyTo(suggestion.longitude, suggestion.latitude);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const center = pickerRef.current?.getCenter();
    const supabase = createClient();
    const { error } = await supabase
      .from("venues")
      .update({
        name,
        address: address || null,
        ...(center ? { location: `POINT(${center.longitude} ${center.latitude})` } : {}),
      })
      .eq("id", venue.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${groupId}/venues`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <VenueNameInput value={name} onChange={setName} onSelect={handleSelectSuggestion} />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address (optional)
        </label>
        <VenueNameInput
          id="address"
          required={false}
          value={address}
          onChange={setAddress}
          onSelect={handleSelectAddressSuggestion}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <VenueLocationPicker
          ref={pickerRef}
          initialLongitude={venue.longitude}
          initialLatitude={venue.latitude}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
