// "Cheap" ellipsoid defaults to avoid dependenging on `ellipsoid.js`

import {WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z} from '../constants';

const wgs84radiiSquared = [
  WGS84_RADIUS_X * WGS84_RADIUS_X,
  WGS84_RADIUS_Y * WGS84_RADIUS_Y,
  WGS84_RADIUS_Z * WGS84_RADIUS_Z
];
const wgs84OneOverRadii = [1.0 / WGS84_RADIUS_X, 1.0 / WGS84_RADIUS_Y, 1.0 / WGS84_RADIUS_Z];
const wgs84OneOverRadiiSquared = [
  (1.0 / WGS84_RADIUS_X) * WGS84_RADIUS_X,
  (1.0 / WGS84_RADIUS_Y) * WGS84_RADIUS_Y,
  (1.0 / WGS84_RADIUS_Z) * WGS84_RADIUS_Z
];
const wgs84CenterToleranceSquared = 1e-1; // EPSILON1;

export default function getEllipsoidProperties(ellipsoid) {
  return {
    radiiSquared: ellipsoid ? ellipsoid.radiiSquared : wgs84radiiSquared,
    oneOverRadii: ellipsoid ? ellipsoid.oneOverRadii : wgs84OneOverRadii,
    oneOverRadiiSquared: ellipsoid ? ellipsoid.oneOverRadiiSquared : wgs84OneOverRadiiSquared,
    centerToleranceSquared: ellipsoid
      ? ellipsoid._centerToleranceSquared
      : wgs84CenterToleranceSquared
  };
}
