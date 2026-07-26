"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VenueLocationPicker, type VenueLocationPickerHandle } from "../VenueLocationPicker";
import { VenueNameInput, type VenueSuggestion } from "../VenueNameInput";

export default function NewVenuePage() {
  const router = useRouter();
  const { id: groupId } = useParams<{ id: string }>();
  const pickerRef = useRef<VenueLocationPickerHandle>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
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
    if (!center) {
      setError("Could not read the pinned location. Try again.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("venues").insert({
      group_id: groupId,
      name,
      address: address || null,
      location: `POINT(${center.longitude} ${center.latitude})`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${groupId}/venues`);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">Add a venue</h1>

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
            <VenueLocationPicker ref={pickerRef} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save venue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href={`/groups/${groupId}/venues`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to venues
          </Link>
        </p>
      </div>
    </main>
  );
}
