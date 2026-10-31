/** Computes a usable map extent for a bounded sample of longitude/latitude points. */
export function getCatalogPointBounds(points: readonly {position: [number, number]}[]): [number, number, number, number] | undefined {
  if (!points.length) return undefined;
  let west = 180;
  let south = 85;
  let east = -180;
  let north = -85;
  for (const {position: [longitude, latitude]} of points) {
    const clampedLatitude = Math.max(-85, Math.min(85, latitude));
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, clampedLatitude);
    north = Math.max(north, clampedLatitude);
  }
  if (west === east) { west = Math.max(-180, west - 0.01); east = Math.min(180, east + 0.01); }
  if (south === north) { south = Math.max(-85.01, south - 0.01); north = Math.min(85.01, north + 0.01); }
  return [west, south, east, north];
}
