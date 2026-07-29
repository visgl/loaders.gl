import type {Tile3D} from '../common/tile-3d';
import {Vector3} from '@math.gl/core';
import {CullingVolume, Plane} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {GeospatialViewport, Viewport} from '../../types';

export type FrameState = {
  camera: {
    position: number[];
    direction: number[];
    up: number[];
  };
  viewport: GeospatialViewport;
  topDownViewport: GeospatialViewport; // Use it to calculate projected radius for a tile
  height: number;
  cullingVolume: CullingVolume;
  frameNumber: number; // TODO: This can be the same between updates, what number is unique for between updates?
  sseDenominator: number; // Assumes fovy = 60 degrees
};

/** Options for {@link getFrameState}. */
export type GetFrameStateOptions = {
  /**
   * Elevation in meters of the viewport's ground plane (z = 0) above the WGS84 ellipsoid.
   * The viewport's `unprojectPosition` returns heights above the ground plane, while
   * `region` bounding volumes carry absolute ellipsoidal heights, so the culling camera and
   * frustum planes are lifted by this amount to align the culling frame with the content.
   * Defaults to 0 (ground plane on the ellipsoid).
   */
  groundHeightDatum?: number;
};

const scratchVector = new Vector3();
const scratchPosition = new Vector3();
const cullingVolume = new CullingVolume([
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane()
]);

// Extracts a frame state appropriate for tile culling from a deck.gl viewport
// TODO - this could likely be generalized and merged back into deck.gl for other culling scenarios
export function getFrameState(
  viewport: GeospatialViewport,
  frameNumber: number,
  options: GetFrameStateOptions = {}
): FrameState {
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  const {cameraDirection, cameraUp, height} = viewport;
  const {metersPerUnit} = viewport.distanceScales;
  const groundHeightDatum = options.groundHeightDatum ?? 0;

  // TODO - Ellipsoid.eastNorthUpToFixedFrame() breaks on raw array, create a Vector.
  // TODO - Ellipsoid.eastNorthUpToFixedFrame() takes a cartesian, is that intuitive?
  const viewportCenterCartesian = worldToCartesian(viewport, viewport.center, groundHeightDatum);
  const enuToFixedTransform = Ellipsoid.WGS84.eastNorthUpToFixedFrame(viewportCenterCartesian);

  const cameraPositionCartographic = viewport.unprojectPosition(viewport.cameraPosition);
  cameraPositionCartographic[2] += groundHeightDatum;
  const cameraPositionCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    cameraPositionCartographic,
    new Vector3()
  );

  // These should still be normalized as the transform has scale 1 (goes from meters to meters)
  const cameraDirectionCartesian = new Vector3(
    // @ts-ignore
    enuToFixedTransform.transformAsVector(new Vector3(cameraDirection).scale(metersPerUnit))
  ).normalize();
  const cameraUpCartesian = new Vector3(
    // @ts-ignore
    enuToFixedTransform.transformAsVector(new Vector3(cameraUp).scale(metersPerUnit))
  ).normalize();

  commonSpacePlanesToWGS84(viewport, groundHeightDatum);

  const ViewportClass = viewport.constructor;
  const {longitude, latitude, width, bearing, zoom} = viewport;
  // @ts-ignore
  const topDownViewport = new ViewportClass({
    longitude,
    latitude,
    height,
    width,
    bearing,
    zoom,
    pitch: 0
  });

  // TODO: make a file/class for frameState and document what needs to be attached to this so that traversal can function
  return {
    camera: {
      position: cameraPositionCartesian,
      direction: cameraDirectionCartesian,
      up: cameraUpCartesian
    },
    viewport,
    topDownViewport,
    height,
    cullingVolume,
    frameNumber, // TODO: This can be the same between updates, what number is unique for between updates?
    sseDenominator: 1.15 // Assumes fovy = 60 degrees
  };
}

/**
 * Limit `tiles` array length with `maximumTilesSelected` number.
 * The criteria for this filtering is distance of a tile center
 * to the `frameState.viewport`'s longitude and latitude
 * @param tiles - tiles array to filter
 * @param frameState - frameState to calculate distances
 * @param maximumTilesSelected - maximal amount of tiles in the output array
 * @returns new tiles array
 */
export function limitSelectedTiles(
  tiles: Tile3D[],
  frameState: FrameState,
  maximumTilesSelected: number
): [Tile3D[], Tile3D[]] {
  if (maximumTilesSelected === 0 || tiles.length <= maximumTilesSelected) {
    return [tiles, []];
  }
  // Accumulate distances in couples array: [tileIndex: number, distanceToViewport: number]
  const tuples: [number, number][] = [];
  const {longitude: viewportLongitude, latitude: viewportLatitude} = frameState.viewport;
  for (const [index, tile] of tiles.entries()) {
    const [longitude, latitude] = tile.header.mbs;
    const deltaLon = Math.abs(viewportLongitude - longitude);
    const deltaLat = Math.abs(viewportLatitude - latitude);
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);
    tuples.push([index, distance]);
  }
  const tuplesSorted = tuples.sort((a, b) => a[1] - b[1]);
  const selectedTiles: Tile3D[] = [];
  for (let i = 0; i < maximumTilesSelected; i++) {
    selectedTiles.push(tiles[tuplesSorted[i][0]]);
  }
  const unselectedTiles: Tile3D[] = [];
  for (let i = maximumTilesSelected; i < tuplesSorted.length; i++) {
    unselectedTiles.push(tiles[tuplesSorted[i][0]]);
  }

  return [selectedTiles, unselectedTiles];
}

function commonSpacePlanesToWGS84(viewport, groundHeightDatum: number) {
  // Extract frustum planes based on current view.
  const frustumPlanes = viewport.getFrustumPlanes();

  // Get the near/far plane centers
  const nearCenterCommon = closestPointOnPlane(frustumPlanes.near, viewport.cameraPosition);
  const nearCenterCartesian = worldToCartesian(viewport, nearCenterCommon, groundHeightDatum);
  const cameraCartesian = worldToCartesian(
    viewport,
    viewport.cameraPosition,
    groundHeightDatum,
    scratchPosition
  );

  let i = 0;
  cullingVolume.planes[i++].fromPointNormal(
    nearCenterCartesian,
    scratchVector.copy(nearCenterCartesian).subtract(cameraCartesian)
  );

  for (const dir in frustumPlanes) {
    if (dir === 'near') {
      continue; // eslint-disable-line no-continue
    }
    const plane = frustumPlanes[dir];
    const posCommon = closestPointOnPlane(plane, nearCenterCommon, scratchPosition);
    const cartesianPos = worldToCartesian(viewport, posCommon, groundHeightDatum, scratchPosition);

    cullingVolume.planes[i++].fromPointNormal(
      cartesianPos,
      // Want the normal to point into the frustum since that's what culling expects
      scratchVector.copy(nearCenterCartesian).subtract(cartesianPos)
    );
  }
}

function closestPointOnPlane(
  plane: {distance: number; normal: Vector3},
  refPoint: [number, number, number] | Vector3,
  out: Vector3 = new Vector3()
): Vector3 {
  const distanceToRef = plane.normal.dot(refPoint);
  out
    .copy(plane.normal)
    .scale(plane.distance - distanceToRef)
    .add(refPoint);
  return out;
}

function worldToCartesian(
  viewport: Viewport,
  point: number[] | Vector3,
  groundHeightDatum: number,
  out: Vector3 = new Vector3()
): Vector3 {
  const cartographicPos = viewport.unprojectPosition(point);
  // `unprojectPosition` heights are relative to the viewport's ground plane, but
  // `cartographicToCartesian` expects heights above the ellipsoid.
  cartographicPos[2] += groundHeightDatum;
  return Ellipsoid.WGS84.cartographicToCartesian(cartographicPos, out);
}

/** Minimal tile-tree shape needed for ground-height derivation (structural subset of Tile3D). */
type RegionTileNode = {
  header?: {boundingVolume?: {region?: number[]}} | null;
  children?: RegionTileNode[] | null;
};

/**
 * Resolves the `groundHeightDatum` tileset option to a concrete elevation in meters.
 * @param groundHeightDatum Elevation in meters of the viewport's ground plane above the
 *   WGS84 ellipsoid, or `'auto'` to derive it from `region` bounding volumes.
 * @param rootTile Root of the (partially loaded) tile tree used for `'auto'` derivation:
 *   the minimum height of the deepest loaded `region` containing the viewport center wins,
 *   seeded by the root region's minimum height. Tilesets without region volumes
 *   (`box`/`sphere`/I3S) resolve to 0.
 * @param viewportCenter Viewport center in degrees, used to pick the containing regions.
 * @returns The ground plane elevation in meters (0 when nothing can be derived).
 */
export function resolveGroundHeightDatum(
  groundHeightDatum: number | 'auto',
  rootTile?: RegionTileNode | null,
  viewportCenter?: {longitude: number; latitude: number} | null
): number {
  if (typeof groundHeightDatum === 'number') {
    return Number.isFinite(groundHeightDatum) ? groundHeightDatum : 0;
  }
  let datum = getRegionMinimumHeight(rootTile?.header?.boundingVolume?.region) ?? 0;
  if (!rootTile || !viewportCenter) {
    return datum;
  }

  // Descend to the deepest loaded region containing the viewport center. The tree deepens
  // as external tilesets load, so successive frames converge on the local ground height.
  const longitudeRadians = (viewportCenter.longitude * Math.PI) / 180;
  const latitudeRadians = (viewportCenter.latitude * Math.PI) / 180;
  let currentTile: RegionTileNode | null = rootTile;
  const visitedTiles = new Set<RegionTileNode>();
  while (currentTile && !visitedTiles.has(currentTile)) {
    visitedTiles.add(currentTile);
    let nextTile: RegionTileNode | null = null;
    for (const childTile of currentTile.children || []) {
      const region = childTile?.header?.boundingVolume?.region;
      if (!regionContains(region, longitudeRadians, latitudeRadians)) {
        continue; // eslint-disable-line no-continue
      }
      const minimumHeight = getRegionMinimumHeight(region);
      if (minimumHeight !== null) {
        datum = Math.max(datum, minimumHeight);
      }
      nextTile = nextTile || childTile;
    }
    currentTile = nextTile;
  }
  return datum;
}

function getRegionMinimumHeight(region: number[] | undefined | null): number | null {
  const minimumHeight = region?.[4];
  return typeof minimumHeight === 'number' && Number.isFinite(minimumHeight) ? minimumHeight : null;
}

function regionContains(
  region: number[] | undefined | null,
  longitudeRadians: number,
  latitudeRadians: number
): boolean {
  if (!Array.isArray(region) || region.length < 6) {
    return false;
  }
  const [west, south, east, north] = region;
  return (
    west <= longitudeRadians &&
    longitudeRadians <= east &&
    south <= latitudeRadians &&
    latitudeRadians <= north
  );
}
