"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Geographic center of the contiguous US — neutral fallback when geolocation
// is denied/unavailable and there's no existing venue location to seed from.
const DEFAULT_CENTER = { longitude: -98.5795, latitude: 39.8283 };
const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

export type VenueLocationPickerHandle = {
  getCenter: () => { longitude: number; latitude: number };
  flyTo: (longitude: number, latitude: number) => void;
};

export const VenueLocationPicker = forwardRef<
  VenueLocationPickerHandle,
  { initialLongitude?: number; initialLatitude?: number }
>(function VenueLocationPicker({ initialLongitude, initialLatitude }, ref) {
  const mapRef = useRef<MapRef>(null);
  const isEditing = initialLongitude !== undefined && initialLatitude !== undefined;

  useImperativeHandle(ref, () => ({
    getCenter() {
      const center = mapRef.current?.getMap()?.getCenter();
      return center
        ? { longitude: center.lng, latitude: center.lat }
        : {
            longitude: initialLongitude ?? DEFAULT_CENTER.longitude,
            latitude: initialLatitude ?? DEFAULT_CENTER.latitude,
          };
    },
    flyTo(longitude, latitude) {
      mapRef.current?.getMap()?.jumpTo({ center: [longitude, latitude], zoom: 15 });
    },
  }));

  // Recenter on the user's current position — but only for a brand-new
  // venue. Never override a saved location when editing.
  useEffect(() => {
    if (isEditing) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.getMap()?.jumpTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
        });
      },
      () => {
        // Permission denied or unavailable — keep the default center.
      },
      { timeout: 5000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-300">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: initialLongitude ?? DEFAULT_CENTER.longitude,
          latitude: initialLatitude ?? DEFAULT_CENTER.latitude,
          zoom: isEditing ? 15 : 3,
        }}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
      />

      {/* Fixed center pin — the map pans under it ("drop pin at center"). */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <div className="h-6 w-6 rounded-full border-2 border-white bg-indigo-600 shadow" />
      </div>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700">
        Move the map to drop the pin
      </p>
    </div>
  );
});
