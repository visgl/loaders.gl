/* eslint-disable */
import {Vector3, radians as toRadians} from 'math.gl';

const PI_OVER_TWO = Math.PI / 2;
const TWO_PI = Math.PI * 2;

// A two dimensional region specified as longitude and latitude coordinates.

class CartographicRectangle {

  // The largest possible rectangle.
  static get MAX_VALUE() {
    return Object.freeze(new CartographicRectangle(-Math.PI, -PI_OVER_TWO, Math.PI, PI_OVER_TWO));
  }

	constructor(west = 0.0, south = 0.0, east = 0.0, north = 0.0) {
		this.west = west;
		this.south = south;
		this.east = east;
		this.north = north;
	}

  // Duplicates a CartographicRectangle.
  clone() {
    return new CartographicRectangle(this.west, this.south, this.east, this.north);
  }

  // Creates a rectangle given the boundary longitude and latitude in degrees.
  fromDegrees(west = 0.0, south = 0.0, east = 0.0, north = 0.0) {
    west = toRadians(west);
    south = toRadians(south);
    east = toRadians(east);
    north = toRadians(north);

    this.west = west;
    this.south = south;
    this.east = east;
    this.north = north;

    return this;
  }

  // Creates a rectangle given the boundary longitude and latitude in radians.
  fromRadians(west = 0.0, south = 0.0, east = 0.0, north = 0.0) {
    this.west = west;
    this.south = south;
    this.east = east;
    this.north = north;

    return this;
  }

	// Gets the width of the rectangle in radians.
	get width() {
		return this.computeWidth(this);
	}

	// Gets the height of the rectangle in radians.
	get height() {
		return this.computeHeight(this);
	}

	/**
	 * Computes the width of a rectangle in radians.
	 * @param {CartographicRectangle} rectangle The rectangle to compute the width of.
	 * @returns {Number} The width.
	 */
	computeWidth() {
		var east = rectangle.east;
		var west = rectangle.west;
		if (east < west) {
			east += TWO_PI;
		}
		return east - west;
	}

	/**
	 * Computes the height of a rectangle in radians.
	 * @param {CartographicRectangle} rectangle The rectangle to compute the height of.
	 * @returns {Number} The height.
	 */
	computeHeight() {
		return rectangle.north - rectangle.south;
	}

	// Creates the smallest possible CartographicRectangle that encloses all positions in the provided array.
	fromCartographicArray(cartographics, result = new CartographicRectangle()) {
		var west = Number.MAX_VALUE;
		var east = -Number.MAX_VALUE;
		var westOverIDL = Number.MAX_VALUE;
		var eastOverIDL = -Number.MAX_VALUE;
		var south = Number.MAX_VALUE;
		var north = -Number.MAX_VALUE;

		for ( var i = 0, len = cartographics.length; i < len; i++) {
			var position = cartographics[i];
			west = Math.min(west, position.longitude);
			east = Math.max(east, position.longitude);
			south = Math.min(south, position.latitude);
			north = Math.max(north, position.latitude);

			var lonAdjusted = position.longitude >= 0 ?  position.longitude : position.longitude +  2 * Math.PI;
			westOverIDL = Math.min(westOverIDL, lonAdjusted);
			eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
		}

		if(east - west > eastOverIDL - westOverIDL) {
			west = westOverIDL;
			east = eastOverIDL;

			if (east > Math.PI) {
				east = east - TWO_PI;
			}
			if (west > Math.PI) {
				west = west - TWO_PI;
			}
		}

		result.west = west;
		result.south = south;
		result.east = east;
		result.north = north;
		return result;
	}

	/**
	 * Creates the smallest possible CartographicRectangle that encloses all positions in the provided array.
	 *
	 * @param {Cartesian3[]} cartesians The list of Cartesian instances.
	 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid the cartesians are on.
	 * @param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
	 * @returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.
	 */
	fromCartesianArray(cartesians, ellipsoid, result = new CartographicRectangle()) {
		//>>includeStart('debug', pragmas.debug);
		Check.defined('cartesians', cartesians);
		//>>includeEnd('debug');
		ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

		var west = Number.MAX_VALUE;
		var east = -Number.MAX_VALUE;
		var westOverIDL = Number.MAX_VALUE;
		var eastOverIDL = -Number.MAX_VALUE;
		var south = Number.MAX_VALUE;
		var north = -Number.MAX_VALUE;

		for ( var i = 0, len = cartesians.length; i < len; i++) {
			var position = ellipsoid.cartesianToCartographic(cartesians[i]);
			west = Math.min(west, position.longitude);
			east = Math.max(east, position.longitude);
			south = Math.min(south, position.latitude);
			north = Math.max(north, position.latitude);

			var lonAdjusted = position.longitude >= 0 ?  position.longitude : position.longitude +  TWO_PI;
			westOverIDL = Math.min(westOverIDL, lonAdjusted);
			eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
		}

		if(east - west > eastOverIDL - westOverIDL) {
			west = westOverIDL;
			east = eastOverIDL;

			if (east > Math.PI) {
				east = east - TWO_PI;
			}
			if (west > Math.PI) {
				west = west - TWO_PI;
			}
		}

		result.west = west;
		result.south = south;
		result.east = east;
		result.north = north;

		return result;
	}

	/**
	 * Compares the provided CartographicRectangles componentwise and returns
	 * <code>true</code> if they pass an absolute or relative tolerance test,
	 * <code>false</code> otherwise.
	 *
	 * @param {CartographicRectangle} [left] The first CartographicRectangle.
	 * @param {CartographicRectangle} [right] The second CartographicRectangle.
	 * @param {Number} absoluteEpsilon The absolute epsilon tolerance to use for equality testing.
	 * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
	 */
	equalsEpsilon(left, right, absoluteEpsilon) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.number('absoluteEpsilon', absoluteEpsilon);
		//>>includeEnd('debug');

		return (left === right) ||
			   (defined(left) &&
				defined(right) &&
				(Math.abs(left.west - right.west) <= absoluteEpsilon) &&
				(Math.abs(left.south - right.south) <= absoluteEpsilon) &&
				(Math.abs(left.east - right.east) <= absoluteEpsilon) &&
				(Math.abs(left.north - right.north) <= absoluteEpsilon));
	}

	/**
	 * Compares the provided rectangles and returns <code>true</code> if they are equal,
	 * <code>false</code> otherwise.
	 *
	 * @param {CartographicRectangle} [left] The first CartographicRectangle.
	 * @param {CartographicRectangle} [right] The second CartographicRectangle.
	 * @returns {Boolean} <code>true</code> if left and right are equal; otherwise <code>false</code>.
	 */
	equals(left, right) {
		return (left === right) ||
			   ((defined(left)) &&
				(defined(right)) &&
				(left.west === right.west) &&
				(left.south === right.south) &&
				(left.east === right.east) &&
				(left.north === right.north));
	}

	/**
	 * Computes the southwest corner of a rectangle.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle for which to find the corner
	 * @param {Cartographic} [result] The object onto which to store the result.
	 * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
	 */
	southwest(rectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		if (!defined(result)) {
			return new Cartographic(rectangle.west, rectangle.south);
		}
		result.longitude = rectangle.west;
		result.latitude = rectangle.south;
		result.height = 0.0;
		return result;
	}

	/**
	 * Computes the northwest corner of a rectangle.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle for which to find the corner
	 * @param {Cartographic} [result] The object onto which to store the result.
	 * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
	 */
	northwest(rectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		if (!defined(result)) {
			return new Cartographic(rectangle.west, rectangle.north);
		}
		result.longitude = rectangle.west;
		result.latitude = rectangle.north;
		result.height = 0.0;
		return result;
	}

	/**
	 * Computes the northeast corner of a rectangle.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle for which to find the corner
	 * @param {Cartographic} [result] The object onto which to store the result.
	 * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
	 */
	northeast(rectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		if (!defined(result)) {
			return new Cartographic(rectangle.east, rectangle.north);
		}
		result.longitude = rectangle.east;
		result.latitude = rectangle.north;
		result.height = 0.0;
		return result;
	}

	/**
	 * Computes the southeast corner of a rectangle.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle for which to find the corner
	 * @param {Cartographic} [result] The object onto which to store the result.
	 * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
	 */
	southeast(rectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		if (!defined(result)) {
			return new Cartographic(rectangle.east, rectangle.south);
		}
		result.longitude = rectangle.east;
		result.latitude = rectangle.south;
		result.height = 0.0;
		return result;
	}

	/**
	 * Computes the center of a rectangle.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle for which to find the center
	 * @param {Cartographic} [result] The object onto which to store the result.
	 * @returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
	 */
	center(rectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		var east = rectangle.east;
		var west = rectangle.west;

		if (east < west) {
			east += TWO_PI;
		}

		var longitude = CesiumMath.negativePiToPi((west + east) * 0.5);
		var latitude = (rectangle.south + rectangle.north) * 0.5;

		if (!defined(result)) {
			return new Cartographic(longitude, latitude);
		}

		result.longitude = longitude;
		result.latitude = latitude;
		result.height = 0.0;
		return result;
	}

	/**
	 * Computes the intersection of two rectangles.  This function assumes that the rectangle's coordinates are
	 * latitude and longitude in radians and produces a correct intersection, taking into account the fact that
	 * the same angle can be represented with multiple values as well as the wrapping of longitude at the
	 * anti-meridian.  For a simple intersection that ignores these factors and can be used with projected
	 * coordinates, see {@link CartographicRectangle.simpleIntersection}.
	 *
	 * @param {CartographicRectangle} rectangle On rectangle to find an intersection
	 * @param {CartographicRectangle} otherRectangle Another rectangle to find an intersection
	 * @param {CartographicRectangle} [result] The object onto which to store the result.
	 * @returns {CartographicRectangle|undefined} The modified result parameter, a new CartographicRectangle instance if none was provided or undefined if there is no intersection.
	 */
	intersection(rectangle, otherRectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		Check.typeOf.object('otherRectangle', otherRectangle);
		//>>includeEnd('debug');

		var rectangleEast = rectangle.east;
		var rectangleWest = rectangle.west;

		var otherRectangleEast = otherRectangle.east;
		var otherRectangleWest = otherRectangle.west;

		if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
			rectangleEast += TWO_PI;
		} else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
			otherRectangleEast += TWO_PI;
		}

		if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
			otherRectangleWest += TWO_PI;
		} else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
			rectangleWest += TWO_PI;
		}

		var west = CesiumMath.negativePiToPi(Math.max(rectangleWest, otherRectangleWest));
		var east = CesiumMath.negativePiToPi(Math.min(rectangleEast, otherRectangleEast));

		if ((rectangle.west < rectangle.east || otherRectangle.west < otherRectangle.east) && east <= west) {
			return undefined;
		}

		var south = Math.max(rectangle.south, otherRectangle.south);
		var north = Math.min(rectangle.north, otherRectangle.north);

		if (south >= north) {
			return undefined;
		}

		if (!defined(result)) {
			return new CartographicRectangle(west, south, east, north);
		}
		result.west = west;
		result.south = south;
		result.east = east;
		result.north = north;
		return result;
	}

	/**
	 * Computes a simple intersection of two rectangles.  Unlike {@link CartographicRectangle.intersection}, this function
	 * does not attempt to put the angular coordinates into a consistent range or to account for crossing the
	 * anti-meridian.  As such, it can be used for rectangles where the coordinates are not simply latitude
	 * and longitude (i.e. projected coordinates).
	 *
	 * @param {CartographicRectangle} rectangle On rectangle to find an intersection
	 * @param {CartographicRectangle} otherRectangle Another rectangle to find an intersection
	 * @param {CartographicRectangle} [result] The object onto which to store the result.
	 * @returns {CartographicRectangle|undefined} The modified result parameter, a new CartographicRectangle instance if none was provided or undefined if there is no intersection.
	 */
	simpleIntersection(rectangle, otherRectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		Check.typeOf.object('otherRectangle', otherRectangle);
		//>>includeEnd('debug');

		var west = Math.max(rectangle.west, otherRectangle.west);
		var south = Math.max(rectangle.south, otherRectangle.south);
		var east = Math.min(rectangle.east, otherRectangle.east);
		var north = Math.min(rectangle.north, otherRectangle.north);

		if (south >= north || west >= east) {
			return undefined;
		}

		if (!defined(result)) {
			return new CartographicRectangle(west, south, east, north);
		}

		result.west = west;
		result.south = south;
		result.east = east;
		result.north = north;
		return result;
	}

	/**
	 * Computes a rectangle that is the union of two rectangles.
	 *
	 * @param {CartographicRectangle} rectangle A rectangle to enclose in rectangle.
	 * @param {CartographicRectangle} otherRectangle A rectangle to enclose in a rectangle.
	 * @param {CartographicRectangle} [result] The object onto which to store the result.
	 * @returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.
	 */
	union(rectangle, otherRectangle, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		Check.typeOf.object('otherRectangle', otherRectangle);
		//>>includeEnd('debug');

		if (!defined(result)) {
			result = new CartographicRectangle();
		}

		var rectangleEast = rectangle.east;
		var rectangleWest = rectangle.west;

		var otherRectangleEast = otherRectangle.east;
		var otherRectangleWest = otherRectangle.west;

		if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
			rectangleEast += TWO_PI;
		} else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
			otherRectangleEast += TWO_PI;
		}

		if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
			otherRectangleWest += TWO_PI;
		} else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
			rectangleWest += TWO_PI;
		}

		var west = CesiumMath.convertLongitudeRange(Math.min(rectangleWest, otherRectangleWest));
		var east = CesiumMath.convertLongitudeRange(Math.max(rectangleEast, otherRectangleEast));

		result.west = west;
		result.south = Math.min(rectangle.south, otherRectangle.south);
		result.east = east;
		result.north = Math.max(rectangle.north, otherRectangle.north);

		return result;	};

	/**
	 * Computes a rectangle by enlarging the provided rectangle until it contains the provided cartographic.
	 *
	 * @param {CartographicRectangle} rectangle A rectangle to expand.
	 * @param {Cartographic} cartographic A cartographic to enclose in a rectangle.
	 * @param {CartographicRectangle} [result] The object onto which to store the result.
	 * @returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if one was not provided.
	 */
	expand(rectangle, cartographic, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		Check.typeOf.object('cartographic', cartographic);
		//>>includeEnd('debug');

		if (!defined(result)) {
			result = new CartographicRectangle();
		}

		result.west = Math.min(rectangle.west, cartographic.longitude);
		result.south = Math.min(rectangle.south, cartographic.latitude);
		result.east = Math.max(rectangle.east, cartographic.longitude);
		result.north = Math.max(rectangle.north, cartographic.latitude);

		return result;	};

	/**
	 * Returns true if the cartographic is on or inside the rectangle, false otherwise.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle
	 * @param {Cartographic} cartographic The cartographic to test.
	 * @returns {Boolean} true if the provided cartographic is inside the rectangle, false otherwise.
	 */
	contains(rectangle, cartographic) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		Check.typeOf.object('cartographic', cartographic);
		//>>includeEnd('debug');

		var longitude = cartographic.longitude;
		var latitude = cartographic.latitude;

		var west = rectangle.west;
		var east = rectangle.east;

		if (east < west) {
			east += TWO_PI;
			if (longitude < 0.0) {
				longitude += TWO_PI;
			}
		}
		return (longitude > west || CesiumMath.equalsEpsilon(longitude, west, CesiumMath.EPSILON14)) &&
			   (longitude < east || CesiumMath.equalsEpsilon(longitude, east, CesiumMath.EPSILON14)) &&
			   latitude >= rectangle.south &&
			   latitude <= rectangle.north;
	}

	/**
	 * Samples a rectangle so that it includes a list of Cartesian points suitable for passing to
	 * {@link BoundingSphere#fromPoints}.  Sampling is necessary to account
	 * for rectangles that cover the poles or cross the equator.
	 *
	 * @param {CartographicRectangle} rectangle The rectangle to subsample.
	 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
	 * @param {Number} [surfaceHeight=0.0] The height of the rectangle above the ellipsoid.
	 * @param {Cartesian3[]} [result] The array of Cartesians onto which to store the result.
	 * @returns {Cartesian3[]} The modified result parameter or a new Array of Cartesians instances if none was provided.
	 */
	subsample(rectangle, ellipsoid, surfaceHeight, result = new Vector3()) {
		//>>includeStart('debug', pragmas.debug);
		Check.typeOf.object('rectangle', rectangle);
		//>>includeEnd('debug');

		ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
		surfaceHeight = defaultValue(surfaceHeight, 0.0);

		if (!defined(result)) {
			result = [];
		}
		var length = 0;

		var north = rectangle.north;
		var south = rectangle.south;
		var east = rectangle.east;
		var west = rectangle.west;

		var lla = subsampleLlaScratch;
		lla.height = surfaceHeight;

		lla.longitude = west;
		lla.latitude = north;
		result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
		length++;

		lla.longitude = east;
		result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
		length++;

		lla.latitude = south;
		result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
		length++;

		lla.longitude = west;
		result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
		length++;

		if (north < 0.0) {
			lla.latitude = north;
		} else if (south > 0.0) {
			lla.latitude = south;
		} else {
			lla.latitude = 0.0;
		}

		for ( var i = 1; i < 8; ++i) {
			lla.longitude = -Math.PI + i * PI_OVER_TWO;
			if (CartographicRectangle.contains(rectangle, lla)) {
				result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
				length++;
			}
		}

		if (lla.latitude === 0.0) {
			lla.longitude = west;
			result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
			length++;
			lla.longitude = east;
			result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
			length++;
		}
		result.length = length;
		return result;
	};

  /**
   * Checks a CartographicRectangle's properties and throws if they are not in valid ranges.
   *
   * @param {CartographicRectangle} rectangle The rectangle to validate
   *
   * @exception {DeveloperError} <code>north</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
   * @exception {DeveloperError} <code>south</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
   * @exception {DeveloperError} <code>east</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
   * @exception {DeveloperError} <code>west</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
   */
  validate() {
    const north = this.north;
    Check.typeOf.number.greaterThanOrEquals('north', north, -PI_OVER_TWO);
    Check.typeOf.number.lessThanOrEquals('north', north, PI_OVER_TWO);

    const south = this.south;
    Check.typeOf.number.greaterThanOrEquals('south', south, -PI_OVER_TWO);
    Check.typeOf.number.lessThanOrEquals('south', south, PI_OVER_TWO);

    const west = this.west;
    Check.typeOf.number.greaterThanOrEquals('west', west, -Math.PI);
    Check.typeOf.number.lessThanOrEquals('west', west, Math.PI);

    const east = this.east;
    Check.typeOf.number.greaterThanOrEquals('east', east, -Math.PI);
    Check.typeOf.number.lessThanOrEquals('east', east, Math.PI);
    //>>includeEnd('debug');
  }
}


/*

  /**
   * The number of elements used to pack the object into an array.
   * @type {Number}
   *
  CartographicRectangle.packedLength = 4;

  /**
   * Stores the provided instance into the provided array.
   *
   * @param {CartographicRectangle} value The value to pack.
   * @param {Number[]} array The array to pack into.
   * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {Number[]} The array that was packed into
   *
  CartographicRectangle.pack(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('value', value);
    Check.defined('array', array);
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);

    array[startingIndex++] = value.west;
    array[startingIndex++] = value.south;
    array[startingIndex++] = value.east;
    array[startingIndex] = value.north;

    return array;
  };

  /**
   * Retrieves an instance from a packed array.
   *
   * @param {Number[]} array The packed array.
   * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {CartographicRectangle} [result] The object into which to store the result.
   * @returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if one was not provided.
   *
  CartographicRectangle.unpack(array, startingIndex, result = new Vector3()) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined('array', array);
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);

    if (!defined(result)) {
      result = new CartographicRectangle();
    }

    result.west = array[startingIndex++];
    result.south = array[startingIndex++];
    result.east = array[startingIndex++];
    result.north = array[startingIndex];
    return result;
  };
*/