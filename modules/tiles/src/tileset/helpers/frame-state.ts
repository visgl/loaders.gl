import {Vector3} from '@math.gl/core';
import {CullingVolume, Plane} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';

export type FrameState = {
  camera: {
    position: number[];
    direction: number[];
    up: number[];
  };
  viewport: {[key: string]: any};
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
export function getFrameState(viewport, frameNumber: number): FrameState {
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  const {cameraDirection, cameraUp, height} = viewport;
  const {metersPerUnit} = viewport.distanceScales;

  const viewportCenterCartographic = viewport.unprojectPosition(viewport.center);
  // TODO - Ellipsoid.eastNorthUpToFixedFrame() breaks on raw array, create a Vector.
  // TODO - Ellipsoid.eastNorthUpToFixedFrame() takes a cartesian, is that intuitive?
  const viewportCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    viewportCenterCartographic,
    new Vector3()
  );
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

  commonSpacePlanesToWGS84(viewport, viewportCenterCartesian);

  // TODO: make a file/class for frameState and document what needs to be attached to this so that traversal can function
  return {
    camera: {
      position: cameraPositionCartesian,
      direction: cameraDirectionCartesian,
      up: cameraUpCartesian
    },
    viewport,
    height,
    cullingVolume,
    frameNumber, // TODO: This can be the same between updates, what number is unique for between updates?
    sseDenominator: 1.15 // Assumes fovy = 60 degrees
  };
}

function commonSpacePlanesToWGS84(viewport, viewportCenterCartesian) {
  // Extract frustum planes based on current view.
  const frustumPlanes = viewport.getFrustumPlanes();
  let i = 0;
  for (const dir in frustumPlanes) {
    const plane = frustumPlanes[dir];
    const distanceToCenter = plane.normal.dot(viewport.center);
    scratchPosition
      .copy(plane.normal)
      .scale(plane.distance - distanceToCenter)
      .add(viewport.center);
    const cartographicPos = viewport.unprojectPosition(scratchPosition);

    const cartesianPos = Ellipsoid.WGS84.cartographicToCartesian(cartographicPos, new Vector3());

    cullingVolume.planes[i++].fromPointNormal(
      cartesianPos,
      // Want the normal to point into the frustum since that's what culling expects
      scratchVector.copy(viewportCenterCartesian).subtract(cartesianPos)
    );
  }
}
