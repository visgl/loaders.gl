import {Tile3D} from '@loaders.gl/tiles';
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
export function getFrameState(viewport: GeospatialViewport, frameNumber: number): FrameState {
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  const {cameraDirection, cameraUp, height} = viewport;
  const {metersPerUnit} = viewport.distanceScales;

  // TODO - Ellipsoid.eastNorthUpToFixedFrame() breaks on raw array, create a Vector.
  // TODO - Ellipsoid.eastNorthUpToFixedFrame() takes a cartesian, is that intuitive?
  const viewportCenterCartesian = worldToCartesian(viewport, viewport.center);
  const enuToFixedTransform = Ellipsoid.WGS84.eastNorthUpToFixedFrame(viewportCenterCartesian);

  const cameraPositionCartographic = viewport.unprojectPosition(viewport.cameraPosition);
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

  commonSpacePlanesToWGS84(viewport);

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

function commonSpacePlanesToWGS84(viewport) {
  // Extract frustum planes based on current view.
  const frustumPlanes = viewport.getFrustumPlanes();

  // Get the near/far plane centers
  const nearCenterCommon = closestPointOnPlane(frustumPlanes.near, viewport.cameraPosition);
  const nearCenterCartesian = worldToCartesian(viewport, nearCenterCommon);
  const cameraCartesian = worldToCartesian(viewport, viewport.cameraPosition, scratchPosition);

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
    const cartesianPos = worldToCartesian(viewport, posCommon, scratchPosition);

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
  out: Vector3 = new Vector3()
): Vector3 {
  const cartographicPos = viewport.unprojectPosition(point);
  return Ellipsoid.WGS84.cartographicToCartesian(cartographicPos, out);
}
