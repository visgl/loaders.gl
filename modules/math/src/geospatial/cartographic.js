/* eslint-disable */
import {Vector3, degrees as toDegrees, radians as toRadians} from 'math.gl';
import assert from '../utils/assert';
import scaleToGeodeticSurface from './helpers/scale-to-geodetic-surface';
import getEllipsoidProperties from './helpers/get-ellipsoid-properties';

const scratchN = new Vector3();
const scratchK = new Vector3();

// const cartesianToCartographicN = new Vector3();
// const cartesianToCartographicP = new Vector3();
// const cartesianToCartographicH = new Vector3();

export default class Cartographic extends Vector3 {
  get longitude() {
    return this[0];
  }

  set longitude(value) {
    this[0] = value;
    return value;
  }

  get latitude() {
    return this[1];
  }

  set latitude(value) {
    this[1] = value;
    return value;
  }

  get height() {
    return this[2];
  }

  set height(value) {
    this[2] = value;
    return value;
  }

  // Returns longitude and latitude values in radians (from degrees)
  static toRadians([longitude, latitude, z = 0], result = [0, 0, 0]) {
    assert(Number.isFinite(longitude));
    assert(Number.isFinite(latitude));

    result[0] = toRadians(longitude);
    result[1] = toRadians(latitude);
    result[2] = z;
    return result;
  }

  // Returns longitude and latitude values in degrees (from radians)
  static toDegrees([longitude, latitude, z = 0], result = [0, 0, 0]) {
    assert(Number.isFinite(longitude));
    assert(Number.isFinite(latitude));

    result[0] = toDegrees(longitude);
    result[1] = toDegrees(latitude);
    result[2] = z;
  }

  // Returns a cartesian position from longitude and latitude values given in radians.
  static toCartesian([longitude, latitude, z = 0], ellipsoid, result) {
    assert(Number.isFinite(longitude));
    assert(Number.isFinite(latitude));

    const {radiiSquared} = getEllipsoidProperties(ellipsoid);

    const cosLatitude = Math.cos(latitude);
    scratchN.x = cosLatitude * Math.cos(longitude);
    scratchN.y = cosLatitude * Math.sin(longitude);
    scratchN.z = Math.sin(latitude);
    scratchN.normalize();

    scratchK.set(scratchN).scale(radiiSquared);

    const gamma = Math.sqrt(scratchN.dot(scratchK));
    scratchK.scale(1 / gamma);
    scratchN.scale = height;

    return scratchN.add(scratchK);
  }

  // Converts a Cartesian geodetic position to a longitude/latitude
  static fromCartesian(cartesian, ellipsoid = WSG84, result = [0, 0, 0]) {
    const {oneOverRadii, oneOverRadiiSquared, centerToleranceSquared} = getEllipsoidFields(
      ellipsoid
    );

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

    result[0] = longitude;
    result[1] = latitude;
    result[2] = height;
    return result;
  }
}
