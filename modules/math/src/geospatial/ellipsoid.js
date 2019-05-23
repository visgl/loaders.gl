/* eslint-disable */
import {Vector3, radians as toRadians} from 'math.gl';
import * as vec3 from 'gl-matrix/vec3';

import assert from '../utils/assert';
import {WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z} from './constants';
import scaleToGeodeticSurface from './helpers/scale-to-geodetic-surface';
import MathUtils from './helpers/math-utils';

const LUNAR_RADIUS = 1737400.0;
const RAD_TO_DEGREE = 180 / Math.PI;

const cartographicToCartesianNormal = new Vector3();
const cartographicToCartesianK = new Vector3();

const cartesianToCartographicN = new Vector3();
const cartesianToCartographicP = new Vector3();
const cartesianToCartographicH = new Vector3();

/*
   * @example
   * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
   * var position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
   * var cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
*/

export default class Ellipsoid {
  // An Ellipsoid instance initialized to the WGS84 standard.
  static get WGS84() {
    return Object.freeze(new Ellipsoid(WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z));
  }

  // An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).
  static get UNIT_SPHERE() {
    return Object.freeze(new Ellipsoid(WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z));
  }

  // An Ellipsoid instance initialized to a sphere with the lunar radius.
  static get MOON() {
    return Object.freeze(new Ellipsoid(LUNAR_RADIUS, LUNAR_RADIUS, LUNAR_RADIUS));
  }

  /**
   * A quadratic surface defined in Cartesian coordinates by the equation
   * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>.  Primarily used
   * by Cesium to represent the shape of planetary bodies.
   *
   * Rather than constructing this object directly, one of the provided
   * constants is normally used.
   * @alias Ellipsoid
   * @constructor
   *
   * @param {Number} [x=0] The radius in the x direction.
   * @param {Number} [y=0] The radius in the y direction.
   * @param {Number} [z=0] The radius in the z direction.
   *
   * @exception {DeveloperError} All radii components must be greater than or equal to zero.
   *
   * @see Ellipsoid.fromVector3
   * @see Ellipsoid.WGS84
   * @see Ellipsoid.UNIT_SPHERE
   */
  constructor(x, y, z) {
    this._radii = undefined;
    this._radiiSquared = undefined;
    this._radiiToTheFourth = undefined;
    this._oneOverRadii = undefined;
    this._oneOverRadiiSquared = undefined;
    this._minimumRadius = undefined;
    this._maximumRadius = undefined;
    this._centerToleranceSquared = undefined;
    this._squaredXOverSquaredZ = undefined;

    this.initialize(this, x, y, z);
  }

  initialize(ellipsoid, x = 0.0, y = 0.0, z = 0.0) {
    assert(x >= 0.0);
    assert(y >= 0.0);
    assert(z >= 0.0);

    ellipsoid._radii = new Vector3(x, y, z);

    ellipsoid._radiiSquared = new Vector3(x * x, y * y, z * z);

    ellipsoid._radiiToTheFourth = new Vector3(x * x * x * x, y * y * y * y, z * z * z * z);

    ellipsoid._oneOverRadii = new Vector3(
      x === 0.0 ? 0.0 : 1.0 / x,
      y === 0.0 ? 0.0 : 1.0 / y,
      z === 0.0 ? 0.0 : 1.0 / z
    );

    ellipsoid._oneOverRadiiSquared = new Vector3(
      x === 0.0 ? 0.0 : 1.0 / (x * x),
      y === 0.0 ? 0.0 : 1.0 / (y * y),
      z === 0.0 ? 0.0 : 1.0 / (z * z)
    );

    ellipsoid._minimumRadius = Math.min(x, y, z);

    ellipsoid._maximumRadius = Math.max(x, y, z);

    ellipsoid._centerToleranceSquared = MathUtils.EPSILON1;

    if (ellipsoid._radiiSquared.z !== 0) {
      ellipsoid._squaredXOverSquaredZ = ellipsoid._radiiSquared.x / ellipsoid._radiiSquared.z;
    }
  }

  /**
   * Computes an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions.
   *
   * @param {Vector3} [cartesian=Vector3.ZERO] The ellipsoid's radius in the x, y, and z directions.
   * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
   *                    instance should be created.
   * @returns {Ellipsoid} A new Ellipsoid instance.
   *
   * @exception {DeveloperError} All radii components must be greater than or equal to zero.
   *
   * @see Ellipsoid.WGS84
   * @see Ellipsoid.UNIT_SPHERE
   */
  static fromVector3([x, y, z]) {
    return new Ellipsoid(x, y, z);
  }

  /**
   * Gets the radii of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Vector3}
   * @readonly
   */
  get radii() {
    return this._radii;
  }

  /**
   * Gets the squared radii of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Vector3}
   * @readonly
   */
  get radiiSquared() {
    return this._radiiSquared;
  }

  /**
   * Gets the radii of the ellipsoid raise to the fourth power.
   * @memberof Ellipsoid.prototype
   * @type {Vector3}
   * @readonly
   */
  get radiiToTheFourth() {
    return this._radiiToTheFourth;
  }

  /**
   * Gets one over the radii of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Vector3}
   * @readonly
   */
  get oneOverRadii() {
    return this._oneOverRadii;
  }

  /**
   * Gets one over the squared radii of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Vector3}
   * @readonly
   */
  get oneOverRadiiSquared() {
    return this._oneOverRadiiSquared;
  }

  get centerToleranceSquared() {
    return this._centerToleranceSquared;
  }

  /**
   * Gets the minimum radius of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Number}
   * @readonly
   */
  get minimumRadius() {
    return this._minimumRadius;
  }

  /**
   * Gets the maximum radius of the ellipsoid.
   * @memberof Ellipsoid.prototype
   * @type {Number}
   * @readonly
   */
  get maximumRadius() {
    return this._maximumRadius;
  }

  /**
   * Duplicates an Ellipsoid instance.
   *
   * @param {Ellipsoid} ellipsoid The ellipsoid to duplicate.
   * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
   *                    instance should be created.
   * @returns {Ellipsoid} The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)
   */
  clone(ellipsoid) {
    var radii = ellipsoid._radii;

    return new Ellipsoid(radii.x, radii.y, radii.z);

    // Vector3.clone(radii, result._radii);
    // Vector3.clone(ellipsoid._radiiSquared, result._radiiSquared);
    // Vector3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
    // Vector3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
    // Vector3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
    // result._minimumRadius = ellipsoid._minimumRadius;
    // result._maximumRadius = ellipsoid._maximumRadius;
    // result._centerToleranceSquared = ellipsoid._centerToleranceSquared;
    // return result;
  }

  /**
   * Compares this Ellipsoid against the provided Ellipsoid componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Ellipsoid} [right] The other Ellipsoid.
   * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(right) {
    return this === right || (defined(right) && Vector3.equals(this._radii, right._radii));
  }

  /**
   * Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'.
   *
   * @returns {String} A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.
   */
  toString() {
    return this._radii.toString();
  }
  /**
   * Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.
   * @function
   *
   * @param {Vector3} cartesian The Cartesian for which to to determine the geocentric normal.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter or a new Vector3 instance if none was provided.
   */
  // Ellipsoid.prototype.geocentricSurfaceNormal = Vector3.normalize;

  /**
   * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
   *
   * @param {Cartographic} cartographic The cartographic position for which to to determine the geodetic normal.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter or a new Vector3 instance if none was provided.
   */
  geodeticSurfaceNormalCartographic(cartographic, result = new Vector3()) {
    // var longitude = cartographic.longitude;
    // var latitude = cartographic.latitude;

    const longitude = toRadians(cartographic[0]);
    const latitude = toRadians(cartographic[1]);

    var cosLatitude = Math.cos(latitude);

    var x = cosLatitude * Math.cos(longitude);
    var y = cosLatitude * Math.sin(longitude);
    var z = Math.sin(latitude);

    result.x = x;
    result.y = y;
    result.z = z;

    return result.normalize();
  }

  /**
   * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
   *
   * @param {Vector3} cartesian The Cartesian position for which to to determine the surface normal.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter or a new Vector3 instance if none was provided.
   */
  geodeticSurfaceNormal(cartesian, result = [0, 0, 0]) {
    vec3.multiply(result, cartesian, this._oneOverRadiiSquared);
    return vec3.normalize(new Vector3(), result);
  }

  /**
   * Converts the provided cartographic to Cartesian representation.
   *
   * @param {Cartographic} cartographic The cartographic position.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter or a new Vector3 instance if none was provided.
   *
   */
  cartographicToCartesian(cartographic, result = new Vector3()) {
    const [, , height] = cartographic;

    //`cartographic is required` is thrown from geodeticSurfaceNormalCartographic.
    var normal = cartographicToCartesianNormal;
    var k = cartographicToCartesianK;

    this.geodeticSurfaceNormalCartographic(cartographic, normal);
    k.copy(this._radiiSquared).scale(normal);

    var gamma = Math.sqrt(vec3.dot(normal, k));

    k.scale(1 / gamma);
    normal.scale(height);

    k.add(normal);

    vec3.copy(result, k);

    return result;
  }

  // Converts the provided cartesian to cartographic (lng/lat/z) representation.
  // The cartesian is undefined at the center of the ellipsoid.
  cartesianToCartographic(cartesian, result = [0, 0, 0]) {
    const point = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);

    if (!point) {
      return undefined;
    }

    const normal = this.geodeticSurfaceNormal(point, cartesianToCartographicN);

    const h = cartesianToCartographicH;
    h.copy(cartesian).subtract(point);

    const longitude = Math.atan2(normal[1], normal[0]);
    const latitude = Math.asin(normal[2]);
    const height = Math.sign(vec3.dot(h, cartesian)) * vec3.length(h);

    result[0] = longitude * RAD_TO_DEGREE;
    result[1] = latitude * RAD_TO_DEGREE;
    result[2] = height;

    return result;
  }

  /**
   * Scales the provided Cartesian position along the geodetic surface normal
   * so that it is on the surface of this ellipsoid.  If the position is
   * at the center of the ellipsoid, this function returns undefined.
   *
   * @param {Vector3} cartesian The Cartesian position to scale.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter, a new Vector3 instance if none was provided, or undefined if the position is at the center.
   */
  scaleToGeodeticSurface(cartesian, result) {
    return scaleToGeodeticSurface(cartesian, this, result);
  }

  /**
   * Scales the provided Cartesian position along the geocentric surface normal
   * so that it is on the surface of this ellipsoid.
   *
   * @param {Vector3} cartesian The Cartesian position to scale.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The modified result parameter or a new Vector3 instance if none was provided.
   */
  scaleToGeocentricSurface(cartesian, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('cartesian', cartesian);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Vector3();
    }

    var positionX = cartesian.x;
    var positionY = cartesian.y;
    var positionZ = cartesian.z;
    var oneOverRadiiSquared = this._oneOverRadiiSquared;

    var beta =
      1.0 /
      Math.sqrt(
        positionX * positionX * oneOverRadiiSquared.x +
          positionY * positionY * oneOverRadiiSquared.y +
          positionZ * positionZ * oneOverRadiiSquared.z
      );

    return Vector3.multiplyByScalar(cartesian, beta, result);
  }

  /**
   * Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
   * its components by the result of {@link Ellipsoid#oneOverRadii}.
   *
   * @param {Vector3} position The position to transform.
   * @param {Vector3} [result] The position to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Vector3} The position expressed in the scaled space.  The returned instance is the
   *          one passed as the result parameter if it is not undefined, or a new instance of it is.
   */
  transformPositionToScaledSpace(position, result = new Vector3()) {
    return Vector3.multiplyComponents(position, this._oneOverRadii, result);
  }

  /**
   * Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying
   * its components by the result of {@link Ellipsoid#radii}.
   *
   * @param {Vector3} position The position to transform.
   * @param {Vector3} [result] The position to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Vector3} The position expressed in the unscaled space.  The returned instance is the
   *          one passed as the result parameter if it is not undefined, or a new instance of it is.
   */
  transformPositionFromScaledSpace(position, result = new Vector3()) {
    return Vector3.multiplyComponents(position, this._radii, result);
  }

  /**
   * Computes a point which is the intersection of the surface normal with the z-axis.
   *
   * @param {Vector3} position the position. must be on the surface of the ellipsoid.
   * @param {Number} [buffer = 0.0] A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.
   *                                In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
   *                                In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
   *                                Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2
   * @param {Vector3} [result] The cartesian to which to copy the result, or undefined to create and
   *        return a new instance.
   * @returns {Vector3 | undefined} the intersection point if it's inside the ellipsoid, undefined otherwise
   *
   * @exception {DeveloperError} position is required.
   * @exception {DeveloperError} Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y).
   * @exception {DeveloperError} Ellipsoid.radii.z must be greater than 0.
   */
  getSurfaceNormalIntersectionWithZAxis(position, buffer, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('position', position);

    if (!CesiumMath.equalsEpsilon(this._radii.x, this._radii.y, MathUtils.EPSILON15)) {
      throw new DeveloperError('Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)');
    }

    Check.typeOf.number.greaterThan('Ellipsoid.radii.z', this._radii.z, 0);
    //>>includeEnd('debug');

    buffer = defaultValue(buffer, 0.0);

    var squaredXOverSquaredZ = this._squaredXOverSquaredZ;

    if (!defined(result)) {
      result = new Vector3();
    }

    result.x = 0.0;
    result.y = 0.0;
    result.z = position.z * (1 - squaredXOverSquaredZ);

    if (Math.abs(result.z) >= this._radii.z - buffer) {
      return undefined;
    }

    return result;
  }
}

/*
  /**
   * The number of elements used to pack the object into an array.
   * @type {Number}
   *
  Ellipsoid.packedLength = Vector3.packedLength;

  /**
   * Stores the provided instance into the provided array.
   *
   * @param {Ellipsoid} value The value to pack.
   * @param {Number[]} array The array to pack into.
   * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {Number[]} The array that was packed into
   *
  Ellipsoid.pack = function(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('value', value);
    Check.defined('array', array);
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);

    Vector3.pack(value._radii, array, startingIndex);

    return array;
  };

  /**
   * Retrieves an instance from a packed array.
   *
   * @param {Number[]} array The packed array.
   * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {Ellipsoid} [result] The object into which to store the result.
   * @returns {Ellipsoid} The modified result parameter or a new Ellipsoid instance if one was not provided.
   *
  Ellipsoid.unpack = function(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined('array', array);
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);

    var radii = Vector3.unpack(array, startingIndex);
    return Ellipsoid.fromVector3(radii, result);
  };
*/
