/* eslint-disable */
import {Vector3, degrees as toDegrees, radians as toRadians} from 'math.gl';
import assert from '../utils/assert';
import {WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z} from './constants';
import scaleToGeodeticSurface from './scale-to-geodetic-surface';

const WGS84_RADII_SQUARED = [
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

// const scratchN = new Vector3();
// const scratchK = new Vector3();

// const cartesianToCartographicN = new Vector3();
// const cartesianToCartographicP = new Vector3();
// const cartesianToCartographicH = new Vector3();

export default class Cartographic {
  /**
   * Returns a Vector3 position from longitude and latitude values given in degrees.
   *
   * @param {Number} longitude The longitude, in degrees
   * @param {Number} latitude The latitude, in degrees
   * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The position
   *
   * @example
   * const position = Vector3.fromDegrees(-115.0, 37.0);
   */
  degreesToVector3(longitude, latitude, height, ellipsoid, result) {
    assert(Number.isFinite(longitude));
    assert(Number.isFinite(latitude));

    longitude = toRadians(longitude);
    latitude = toRadians(latitude);
    return Vector3.fromRadians(longitude, latitude, height, ellipsoid, result);
  }

  /**
   * Returns a Vector3 position from longitude and latitude values given in radians.
   *
   * @param {Number} longitude The longitude, in radians
   * @param {Number} latitude The latitude, in radians
   * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The position
   *
   * @example
   * const position = Vector3.fromRadians(-2.007, 0.645);
   */
  radiansToVector3([longitude, latitude, height = 0], ellipsoid, result) {
    assert(Number.isFinite(longitude));
    assert(Number.isFinite(latitude));

    const radiiSquared = ellipsoid ? ellipsoid.radiiSquared : WGS84_RADII_SQUARED;

    const cosLatitude = Math.cos(latitude);
    scratchN.x = cosLatitude * Math.cos(longitude);
    scratchN.y = cosLatitude * Math.sin(longitude);
    scratchN.z = Math.sin(latitude);
    scratchN = Vector3.normalize(scratchN, scratchN);

    Vector3.multiplyComponents(radiiSquared, scratchN, scratchK);
    const gamma = Math.sqrt(Vector3.dot(scratchN, scratchK));
    scratchK = Vector3.divideByScalar(scratchK, gamma, scratchK);
    scratchN = Vector3.multiplyByScalar(scratchN, height, scratchN);

    if (!defined(result)) {
      result = new Vector3();
    }
    return Vector3.add(scratchK, scratchN, result);
  }

  vector3ToDegrees(cartesian, ellipsoid, result = new Vector3()) {
    Cartographic.vector3(vector, ellipsoid, result);
    result[0] = toDegrees(result[0]);
    result[1] = toDegrees(result[1]);
  }

  /**
   * Creates a new Cartographic instance from a Cartesian position. The values in the
   * resulting object will be in radians.
   *
   * @param {Vector3} cartesian The Cartesian position to convert to cartographic representation.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
   * @param {Cartographic} [result] The object onto which to store the result.
   * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
   */
  vector3ToRadians(cartesian, ellipsoid, result = new Vector3()) {
    const oneOverRadii = ellipsoid ? ellipsoid.oneOverRadii : wgs84OneOverRadii;
    const oneOverRadiiSquared = ellipsoid
      ? ellipsoid.oneOverRadiiSquared
      : wgs84OneOverRadiiSquared;
    const centerToleranceSquared = ellipsoid
      ? ellipsoid._centerToleranceSquared
      : wgs84CenterToleranceSquared;

    const p = scaleToGeodeticSurface(
      cartesian,
      oneOverRadii,
      oneOverRadiiSquared,
      centerToleranceSquared,
      cartesianToCartographicP
    );

    if (!defined(p)) {
      return undefined;
    }

    let n = Vector3.multiplyComponents(p, oneOverRadiiSquared, cartesianToCartographicN);
    n = Vector3.normalize(n, n);

    const h = Vector3.subtract(cartesian, p, cartesianToCartographicH);

    const longitude = Math.atan2(n.y, n.x);
    const latitude = Math.asin(n.z);
    const height = sign(Vector3.dot(h, cartesian)) * Vector3.magnitude(h);

    if (!defined(result)) {
      return new Cartographic(longitude, latitude, height);
    }
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = height;
    return result;
  }
}
