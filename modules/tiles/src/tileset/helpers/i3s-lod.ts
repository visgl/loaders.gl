import {toRadians, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const WGS84_RADIUS_X = 6378137.0;
/* eslint-disable max-statements */
export function lodJudge(tile, frameState) {
  const viewport = frameState.viewport;

  const mbsLat = tile.header.mbs[1];
  const mbsLon = tile.header.mbs[0];
  const mbsR = tile.header.mbs[3];

  const {height, width, latitude, longitude} = viewport;

  const viewportCenter = [longitude, latitude];
  const mbsLatProjected = [longitude, mbsLat];
  const mbsLonProjected = [mbsLon, latitude];

  const visibleHeight = height * 0.5 + mbsR / WGS84_RADIUS_X;
  const visibleWidth = width * 0.5 + mbsR / WGS84_RADIUS_X;

  if (getDistanceFromLatLon(viewportCenter, mbsLatProjected) > visibleHeight) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(viewportCenter, mbsLonProjected) > visibleWidth) {
    return 'OUT';
  }

  if (tile.lodMetricValue === 0 || isNaN(tile.lodMetricValue)) {
    return 'DIG';
  }

  // For the maxScreenThreshold error metric, maxError means that you should replace the node with it's children
  // as soon as the nodes bounding sphere has a screen radius larger than maxError pixels.
  // In this sense a value of 0 means you should always load it's children,
  // or if it's a leaf node, you should always display it.
  const screenSize = 2 * getProjectedRadius(tile, frameState);
  if (screenSize < 0.5) {
    return 'OUT';
  }
  if (!tile.header.children || screenSize <= tile.lodMetricValue) {
    return 'DRAW';
  } else if (tile.header.children) {
    return 'DIG';
  }
  return 'OUT';
}
/* eslint-enable max-statements */

function projectVertexToSphere([x, y, z]) {
  const azim = toRadians(x);
  const incl = toRadians(y);
  const radius = 1.0 + z;
  const radCosInc = radius * Math.cos(incl);
  x = radCosInc * Math.cos(azim);
  y = radCosInc * Math.sin(azim);
  z = radius * Math.sin(incl);
  return [x, y, z];
}

function getDistanceFromLatLon(observer: number[], center: number[]) {
  const [observerLon, observerLat, observerZ = 0.0] = observer;
  const [centerLon, centerLat, centerZ = 0.0] = center;

  const projectedCenter = projectVertexToSphere([centerLon, centerLat, centerZ]);
  const projectedObserver = projectVertexToSphere([observerLon, observerLat, observerZ]);
  const dx = projectedObserver[0] - projectedCenter[0];
  const dy = projectedObserver[1] - projectedCenter[1];
  const dz = projectedObserver[2] - projectedCenter[2];
  return dx * dx + dy * dy + dz * dz;
}

export function getProjectedRadius(tile, frameState) {
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
