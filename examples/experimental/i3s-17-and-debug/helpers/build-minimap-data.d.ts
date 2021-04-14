/**
 * Generate data for main viewport tiles to show on the minimap
 *
 * @param tiles - list of tiles selector for display
 * @returns data array for ScatterplotLayer
 */
export function buildMinimapData(tiles: Tile3D[]): ScatterplotData[];

interface ScatterplotData {
  coordinates: number[],
  radius: number
}
