import type { MapView } from "@deck.gl/core";

export const getLonLatWithElevationOffset = (
  zmin: number,
  pitch: number,
  bearing: number,
  longitude: number,
  latitude: number,
  viewport: MapView
): [number, number] => {
  /**
   * See image in the PR https://github.com/visgl/loaders.gl/pull/2046
   * For elevated tilesets cartographic center position of a tileset is not correct
   * to use it as viewState position because these positions are different.
   * We need to calculate projection of camera direction onto the ellipsoid surface.
   * We use this projection as offset to add it to the tileset cartographic center position.
   */
  const projection = zmin * Math.tan((pitch * Math.PI) / 180);
  /**
   * Convert to world coordinate system to shift the position on some distance in meters
   */
  const projectedPostion = viewport.projectPosition([longitude, latitude]);
  /**
   * Shift longitude
   */
  projectedPostion[0] +=
    projection *
    Math.sin((bearing * Math.PI) / 180) *
    viewport.distanceScales.unitsPerMeter[0];
  /**
   * Shift latitude
   */
  projectedPostion[1] +=
    projection *
    Math.cos((bearing * Math.PI) / 180) *
    viewport.distanceScales.unitsPerMeter[1];
  /**
   * Convert resulting coordinates to catrographic
   */
  return viewport.unprojectPosition(projectedPostion);
}
