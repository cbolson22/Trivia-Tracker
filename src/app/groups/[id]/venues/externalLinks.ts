// Zero-setup external links — built from data we already store, no API key needed.
// Google Maps searches the stored address text (falling back to coordinates
// only if no address was entered, since address is optional); Yelp has no
// coordinate-based search, so its link is a pre-filled name/address search
// rather than a guaranteed exact match.

export function getGoogleMapsUrl(
  address: string | null,
  latitude: number,
  longitude: number
): string {
  const query = address ?? `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getYelpSearchUrl(name: string, address: string | null): string {
  const params = new URLSearchParams({ find_desc: name });
  if (address) params.set("find_loc", address);
  return `https://www.yelp.com/search?${params.toString()}`;
}
