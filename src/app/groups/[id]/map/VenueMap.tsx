"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Map, { type MapRef } from "react-map-gl/maplibre";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";
import type { MapVenue } from "./page";

const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

type VenueEntry = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

// Deliberately not typed against the ambient GeoJSON namespace as the source
// of truth (only cast to it at the addSource/setData call sites, where
// maplibre-gl's TS signatures require it) — keeps this local shape stable
// even if the ambient types resolve differently than expected.
type VenueFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { id: string; name: string; address: string };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

function venuesToGeoJSON(venues: MapVenue[]): VenueFeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues.map((venue) => ({
      type: "Feature",
      properties: { id: venue.id, name: venue.name, address: venue.address ?? "" },
      geometry: { type: "Point", coordinates: [venue.longitude, venue.latitude] },
    })),
  };
}

export function VenueMap({ groupId, venues }: { groupId: string; venues: MapVenue[] }) {
  const mapRef = useRef<MapRef>(null);
  const [selectedVenue, setSelectedVenue] = useState<MapVenue | null>(null);
  const [entries, setEntries] = useState<VenueEntry[] | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);

  async function selectVenue(venue: MapVenue) {
    setSelectedVenue(venue);
    setLoadingEntries(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("entries")
      .select("id, question, answer, category")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false });
    setEntries((data ?? []) as VenueEntry[]);
    setLoadingEntries(false);
  }

  function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Globe projection must be set after style load, not before.
    map.setProjection({ type: "globe" });

    map.addSource("venues", {
      type: "geojson",
      data: venuesToGeoJSON(venues) as unknown as GeoJSON.FeatureCollection,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "venues",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#4f46e5",
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 25, 26],
        "circle-opacity": 0.85,
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "venues",
      filter: ["has", "point_count"],
      layout: { "text-field": "{point_count_abbreviated}", "text-size": 14 },
      paint: { "text-color": "#ffffff" },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "venues",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#4f46e5",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.on("click", "clusters", async (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
      const clusterId = features[0]?.properties?.cluster_id;
      if (clusterId === undefined) return;

      const source = map.getSource("venues") as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const geometry = features[0].geometry as { type: "Point"; coordinates: [number, number] };
      map.easeTo({ center: geometry.coordinates, zoom });
    });

    map.on("click", "unclustered-point", (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as { id: string };
      const venue = venues.find((v) => v.id === props.id);
      if (venue) selectVenue(venue);
    });

    map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
    map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));
  }

  // Keep the source's data in sync if `venues` changes after initial load
  // (e.g. router.refresh() after a venue is added/edited/deleted elsewhere).
  useEffect(() => {
    const source = mapRef.current?.getMap()?.getSource("venues") as GeoJSONSource | undefined;
    source?.setData(venuesToGeoJSON(venues) as unknown as GeoJSON.FeatureCollection);
  }, [venues]);

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-lg border border-gray-300">
      <Map
        ref={mapRef}
        onLoad={handleLoad}
        initialViewState={{ longitude: -98.5795, latitude: 39.8283, zoom: 1.5 }}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
      />

      {selectedVenue && (
        <div className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto rounded-t-2xl border-t border-gray-300 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedVenue.name}</h2>
              {selectedVenue.address && (
                <p className="text-sm text-gray-500">{selectedVenue.address}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedVenue(null);
                setEntries(null);
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <Link
            href={`/groups/${groupId}/entries/new?venue_id=${selectedVenue.id}`}
            className="mt-4 block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-indigo-700"
          >
            Add entry for this venue
          </Link>

          <h3 className="mt-4 text-sm font-medium text-gray-700">Linked entries</h3>
          {loadingEntries && <p className="mt-2 text-sm text-gray-500">Loading…</p>}
          {!loadingEntries && entries?.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">No entries logged here yet.</p>
          )}
          <ul className="mt-2 space-y-2">
            {entries?.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-gray-300 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{entry.question}</p>
                {entry.category && <p className="text-xs text-gray-500">{entry.category}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
