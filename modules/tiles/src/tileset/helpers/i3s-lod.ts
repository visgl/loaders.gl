import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Tile3D} from '../..';
import {FrameState} from './frame-state';

/**
 * For the maxScreenThreshold error metric, maxError means that you should replace the node with it's children
   as soon as the nodes bounding sphere has a screen radius larger than maxError pixels.
   In this sense a value of 0 means you should always load it's children,
   or if it's a leaf node, you should always display it.
 * @param tile 
 * @param frameState 
 * @returns 
 */
export function getLodStatus(tile: Tile3D, frameState: FrameState): 'DIG' | 'OUT' | 'DRAW' {
  if (tile.lodMetricValue === 0 || isNaN(tile.lodMetricValue)) {
    return 'DIG';
  }
  const screenSize = 2 * getProjectedRadius(tile, frameState);
  if (screenSize < 2) {
    return 'OUT';
  }
  if (!tile.header.children || screenSize <= tile.lodMetricValue) {
    return 'DRAW';
  } else if (tile.header.children) {
    return 'DIG';
  }
  return 'OUT';
}

/**
 * Calculate size of MBS radius projected on the screen plane
 * @param tile
 * @param frameState
 * @returns
 */
export function getProjectedRadius(tile: Tile3D, frameState: FrameState): number {
  const viewport = frameState.viewport;
  const mbsLat = tile.header.mbs[1];
  const mbsLon = tile.header.mbs[0];
  const mbsZ = tile.header.mbs[2];
  const mbsR = tile.header.mbs[3];
  const mbsCenterCartesian = [...tile.boundingVolume.center];
  const cameraPositionCartesian = [...frameState.camera.position];

  // ---------------------------
  // Calculate mbs border vertex
  // ---------------------------
  const toEye = new Vector3(cameraPositionCartesian).subtract(mbsCenterCartesian).normalize();
  // Add extra vector to form plane
  const topVector = new Vector3([0, 1, 0]).normalize();
  // We need radius vector orthogonal to toEye vector
  const radiusVector = toEye.cross(topVector).normalize().scale(mbsR);
  const sphereMbsBorderVertexCartesian = new Vector3(mbsCenterCartesian).add(radiusVector);
  const sphereMbsBorderVertexCartographic = Ellipsoid.WGS84.cartesianToCartographic(
    sphereMbsBorderVertexCartesian
  );
  // ---------------------------

  // Project center vertex and border vertex and calculate projected radius of MBS
  const projectedOrigin = viewport.project([mbsLon, mbsLat, mbsZ]);
  const projectedMbsBorderVertex = viewport.project(sphereMbsBorderVertexCartographic);
  const projectedRadius = new Vector3(projectedOrigin)
    .subtract(projectedMbsBorderVertex)
    .magnitude();
  return projectedRadius;
}
