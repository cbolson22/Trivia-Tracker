// Zero-setup external links — built from data we already store, no API key needed.
// Google Maps' search-by-coordinates URL scheme gives an exact pin; Yelp has
// no coordinate-based search, so its link is a pre-filled name/address search
// rather than a guaranteed exact match.

export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function getYelpSearchUrl(name: string, address: string | null): string {
  const params = new URLSearchParams({ find_desc: name });
  if (address) params.set("find_loc", address);
  return `https://www.yelp.com/search?${params.toString()}`;
}
