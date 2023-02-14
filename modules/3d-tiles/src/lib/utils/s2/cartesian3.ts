import {toRadians, Vector3} from '@math.gl/core';

/**
 * A 3D Cartesian point.
 * @alias Cartesian3
 * @constructor
 *
 * @param {Number} [x=0.0] The X component.
 * @param {Number} [y=0.0] The Y component.
 * @param {Number} [z=0.0] The Z component.
 *
 * @see Cartesian2
 * @see Cartesian4
 * @see Packable
 */

export default class Cartesian3 {
  x: number;
  y: number;
  z: number;

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
   * @returns {Number} The squared magnitude.
   */
  static magnitudeSquared(cartesian) {
    return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
  }

  /**
   * Computes the Cartesian's magnitude (length).
   *
   * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
   * @returns {Number} The magnitude.
   */
  static magnitude(cartesian) {
    return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
  }

  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian to be normalized.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static normalize(cartesian, result) {
    const magnitude = Cartesian3.magnitude(cartesian);

    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    result.z = cartesian.z / magnitude;
    return result;
  }

  /**
   * Returns a Cartesian3 position from longitude and latitude values given in degrees.
   *
   * @param {Number} longitude The longitude, in degrees
   * @param {Number} latitude The latitude, in degrees
   * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromDegrees(-115.0, 37.0);
   */
  static fromDegrees(longitude, latitude, height, ellipsoid, result) {
    longitude = toRadians(longitude);
    latitude = toRadians(latitude);
    return Cartesian3.fromRadians(longitude, latitude, height, result);
  }

  /**
   * Returns a Cartesian3 position from longitude and latitude values given in radians.
   *
   * @param {Number} longitude The longitude, in radians
   * @param {Number} latitude The latitude, in radians
   * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The position
   *
   * @example
   * const position = Cesium.Cartesian3.fromRadians(-2.007, 0.645);
   */
  static fromRadians(longitude, latitude, height, result?) {
    let scratchN = new Cartesian3(0.0, 0.0, 0.0);
    let scratchK = new Cartesian3(0.0, 0.0, 0.0);
    const wgs84RadiiSquared = new Cartesian3(
      6378137.0 * 6378137.0,
      6378137.0 * 6378137.0,
      6356752.3142451793 * 6356752.3142451793
    );

    const radiiSquared = wgs84RadiiSquared;

    const cosLatitude = Math.cos(latitude);
    scratchN.x = cosLatitude * Math.cos(longitude);
    scratchN.y = cosLatitude * Math.sin(longitude);
    scratchN.z = Math.sin(latitude);
    scratchN = this.normalize(scratchN, scratchN);

    Cartesian3.multiplyComponents(radiiSquared, scratchN, scratchK);
    const gamma = Math.sqrt(this.dot(scratchN, scratchK));
    scratchK = this.divideByScalar(scratchK, gamma, scratchK);
    scratchN = this.multiplyByScalar(scratchN, height, scratchN);

    if (!result) {
      result = new Cartesian3(0.0, 0.0, 0.0);
    }
    return this.add(scratchK, scratchN, result);
  }

  static convertCartToXYZ(longitude, latitude, height, result?) {
    const point = Cartesian3.fromRadians(longitude, latitude, height);
    return new Vector3(point.x, point.y, point.z);
  }
  /**
   * Computes the dot (scalar) product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @returns {Number} The dot product.
   */
  static dot(left, right) {
    return left.x * right.x + left.y * right.y + left.z * right.z;
  }

  /**
   * Computes the componentwise product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyComponents(left, right, result) {
    result.x = left.x * right.x;
    result.y = left.y * right.y;
    result.z = left.z * right.z;
    return result;
  }

  /**
   * Divides the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian3} cartesian The Cartesian to be divided.
   * @param {Number} scalar The scalar to divide by.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static divideByScalar(cartesian, scalar, result) {
    result.x = cartesian.x / scalar;
    result.y = cartesian.y / scalar;
    result.z = cartesian.z / scalar;
    return result;
  }

  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian3} cartesian The Cartesian to be scaled.
   * @param {Number} scalar The scalar to multiply with.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyByScalar(cartesian, scalar, result) {
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    return result;
  }

  /**
   * Computes the componentwise sum of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} result The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static add(left, right, result) {
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;
    return result;
  }
}
