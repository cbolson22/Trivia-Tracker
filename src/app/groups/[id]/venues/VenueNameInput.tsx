"use client";

import { useRef, useState } from "react";

export type VenueSuggestion = {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
};

type PhotonProperties = {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
};

type PhotonFeature = {
  properties: PhotonProperties;
  geometry: { coordinates: [number, number] };
};

function formatAddress(props: PhotonProperties): string {
  const line1 = [props.housenumber, props.street].filter(Boolean).join(" ");
  const line2 = [props.city, props.state, props.postcode].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join(", ");
}

export function VenueNameInput({
  id = "name",
  required = true,
  value,
  onChange,
  onSelect,
  onAutoLocate,
}: {
  id?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: VenueSuggestion) => void;
  // Fired automatically as soon as a search returns a top match — no click
  // required. Unlike onSelect, this must NOT rewrite the input's own text
  // (the user's typed value stays authoritative); it should only reposition
  // the pin. Only pass this for fields where matches are high-confidence
  // (e.g. structured addresses) — omit it for fuzzy name search, where an
  // auto-applied wrong match (e.g. a same-named place on the other side of
  // the world) would be worse than doing nothing.
  onAutoLocate?: (suggestion: VenueSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = e.target.value;
    onChange(nextValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = nextValue.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        const results: VenueSuggestion[] = (data.features ?? []).map((feature: PhotonFeature) => ({
          name: feature.properties.name ?? nextValue,
          address: formatAddress(feature.properties),
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        }));
        setSuggestions(results);
        setOpen(results.length > 0);
        if (results.length > 0) {
          onAutoLocate?.(results[0]);
        }
      } catch {
        // Aborted or network error — leave any existing suggestions alone.
      }
    }, 300);
  }

  function handleSelect(suggestion: VenueSuggestion) {
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        required={required}
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setOpen(false)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onMouseDown={() => handleSelect(suggestion)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{suggestion.name}</span>
                {suggestion.address && (
                  <span className="block text-xs text-gray-500">{suggestion.address}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
