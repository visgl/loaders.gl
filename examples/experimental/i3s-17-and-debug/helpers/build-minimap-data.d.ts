/**
 * Generate data for main viewport tiles to show on the minimap
 *
 * @param tiles - list of tiles selector for display
 * @returns A promise that resolves to object with `geometry`, compressedGeometry`, `texture` and `sharedResources` appropriate
 *  for use  I3S tiles.
 */
export function buildMinimapData(tiles: Tile3D[]): ScatterplotData[];

interface ScatterplotData {
  coordinates: number[],
  radius: number
}