# CartographicRectangle

A two dimensional region specified as longitude and latitude coordinates.


## Usage

Creates a rectangle given the boundary longitude and latitude in degrees.
```js
const rectangle = CartographicRectangle.fromDegrees(0.0, 20.0, 10.0, 30.0);
```

Creates a rectangle given the boundary longitude and latitude in radians.
```js
const rectangle = CartographicRectangle.fromRadians(0.0, Math.PI/4, Math.PI/8, 3*Math.PI/4);
```

## Static Members

### CartographicRectangle.MAX_VALUE

new CartographicRectangle(-Math.PI, -CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO));

## Members

##### west : Number

The westernmost longitude in radians in the range [-Pi, Pi].

default 0.0

##### south : Number

The southernmost latitude in radians in the range [-Pi/2, Pi/2].

default 0.0

##### east : Number

The easternmost longitude in radians in the range [-Pi, Pi].

default 0.0

##### north : Number

The northernmost latitude in radians in the range [-Pi/2, Pi/2].

default 0.0


## Methods

##### constructor(west, south, east, north)

- `west`=`0.0`  The westernmost longitude, in radians, in the range [-Pi, Pi].
- `south`=`0.0`  The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
- `east`=`0.0`  The easternmost longitude, in radians, in the range [-Pi, Pi].
- `north`=`0.0`  The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].


##### computeWidth()

Computes the width of a rectangle in radians.

@returns {Number} The width.

##### computeHeight()

Computes the height of a rectangle in radians.

@returns {Number} The height.

##### fromDegrees(west, south, east, north, result)

Creates a rectangle given the boundary longitude and latitude in degrees.

@param {Number} [west=0.0] The westernmost longitude in degrees in the range [-180.0, 180.0].
@param {Number} [south=0.0] The southernmost latitude in degrees in the range [-90.0, 90.0].
@param {Number} [east=0.0] The easternmost longitude in degrees in the range [-180.0, 180.0].
@param {Number} [north=0.0] The northernmost latitude in degrees in the range [-90.0, 90.0].
@param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.

##### fromRadians(west, south, east, north, result)

Creates a rectangle given the boundary longitude and latitude in radians.

@param {Number} [west=0.0] The westernmost longitude in radians in the range [-Math.PI, Math.PI].
@param {Number} [south=0.0] The southernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
@param {Number} [east=0.0] The easternmost longitude in radians in the range [-Math.PI, Math.PI].
@param {Number} [north=0.0] The northernmost latitude in radians in the range [-Math.PI/2, Math.PI/2].
@param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.


##### fromCartographicArray(cartographics, result)

Creates the smallest possible CartographicRectangle that encloses all positions in the provided array.

@param {Cartographic[]} cartographics The list of Cartographic instances.
@param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.

##### fromCartesianArray(cartesians, ellipsoid, result)

Creates the smallest possible CartographicRectangle that encloses all positions in the provided array.

@param {Cartesian3[]} cartesians The list of Cartesian instances.
@param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid the cartesians are on.
@param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.

##### clone(rectangle, result)

Duplicates a CartographicRectangle.

@param {CartographicRectangle} rectangle The rectangle to clone.
@param {CartographicRectangle} [result] The object onto which to store the result, or undefined if a new instance should be created.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided. (Returns undefined if rectangle is undefined)


Compares the provided CartographicRectangles componentwise and returns
`true` if they pass an absolute or relative tolerance test,
`false` otherwise.

@param {CartographicRectangle} [left] The first CartographicRectangle.
@param {CartographicRectangle} [right] The second CartographicRectangle.
@param {Number} absoluteEpsilon The absolute epsilon tolerance to use for equality testing.
@returns {Boolean} `true` if left and right are within the provided epsilon, `false` otherwise.
/
	CartographicRectangle.equalsEpsilon = function(left, right, absoluteEpsilon)
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
	};


Duplicates this CartographicRectangle.

@param {CartographicRectangle} [result] The object onto which to store the result.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.
/
	CartographicRectangle.prototype.clone = function(result)
		return CartographicRectangle.clone(this, result);
	};


Compares the provided CartographicRectangle with this CartographicRectangle componentwise and returns
`true` if they are equal, `false` otherwise.

@param {CartographicRectangle} [other] The CartographicRectangle to compare.
@returns {Boolean} `true` if the CartographicRectangles are equal, `false` otherwise.
/
	CartographicRectangle.prototype.equals = function(other)
		return CartographicRectangle.equals(this, other);
	};


Compares the provided rectangles and returns `true` if they are equal,
`false` otherwise.

CartographicRectangle.equals = function(left, right)

@param {CartographicRectangle} [left] The first CartographicRectangle.
@param {CartographicRectangle} [right] The second CartographicRectangle.
@returns {Boolean} `true` if left and right are equal; otherwise `false`.


Compares the provided CartographicRectangle with this CartographicRectangle componentwise and returns
`true` if they are within the provided epsilon,
`false` otherwise.

CartographicRectangle.prototype.equalsEpsilon = function(other, epsilon)

@param {CartographicRectangle} [other] The CartographicRectangle to compare.
@param {Number} epsilon The epsilon to use for equality testing.
@returns {Boolean} `true` if the CartographicRectangles are within the provided epsilon, `false` otherwise.

##### validate()

Checks a CartographicRectangle's properties and throws if they are not in valid ranges.

Throws
- `north` must be in the interval [`-Pi/2`, `Pi/2`].
- `south` must be in the interval [`-Pi/2`, `Pi/2`].
- `east` must be in the interval [`-Pi`, `Pi`].
- `west` must be in the interval [`-Pi`, `Pi`].

##### southwest(rectangle, result)

Computes the southwest corner of a rectangle.

@param {CartographicRectangle} rectangle The rectangle for which to find the corner
@param {Cartographic} [result] The object onto which to store the result.
@returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.

##### northwest(rectangle, result)

Computes the northwest corner of a rectangle.

@param {CartographicRectangle} rectangle The rectangle for which to find the corner
@param {Cartographic} [result] The object onto which to store the result.
@returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.

##### northeast(rectangle, result)

Computes the northeast corner of a rectangle.

@param {CartographicRectangle} rectangle The rectangle for which to find the corner
@param {Cartographic} [result] The object onto which to store the result.
@returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.


##### southeast(rectangle, result)

Computes the southeast corner of a rectangle.

@param {CartographicRectangle} rectangle The rectangle for which to find the corner
@param {Cartographic} [result] The object onto which to store the result.
@returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.

##### center = function(rectangle, result)

Computes the center of a rectangle.

@param {CartographicRectangle} rectangle The rectangle for which to find the center
@param {Cartographic} [result] The object onto which to store the result.
@returns {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.

##### intersection = function(rectangle, CartographicotherRectangle, result)

Computes the intersection of two rectangles.  This function assumes that the rectangle's coordinates are
latitude and longitude in radians and produces a correct intersection, taking into account the fact that
the same angle can be represented with multiple values as well as the wrapping of longitude at the
anti-meridian.  For a simple intersection that ignores these factors and can be used with projected
coordinates, see {@link CartographicRectangle.simpleIntersection}.

@param {CartographicRectangle} rectangle On rectangle to find an intersection
@param {CartographicRectangle} CartographicotherRectangle Another rectangle to find an intersection
@param {CartographicRectangle} [result] The object onto which to store the result.


##### simpleIntersection = function(rectangle, CartographicotherRectangle, result)

Computes a simple intersection of two rectangles.  Unlike {@link CartographicRectangle.intersection}, this function
does not attempt to put the angular coordinates into a consistent range or to account for crossing the
anti-meridian.  As such, it can be used for rectangles where the coordinates are not simply latitude
and longitude (i.e. projected coordinates).

@param {CartographicRectangle} rectangle On rectangle to find an intersection
@param {CartographicRectangle} CartographicotherRectangle Another rectangle to find an intersection
@param {CartographicRectangle} [result] The object onto which to store the result.
@returns {CartographicRectangle|undefined} The modified result parameter, a new CartographicRectangle instance if none was provided or undefined if there is no intersection.


##### union(rectangle, CartographicotherRectangle, result)

Computes a rectangle that is the union of two rectangles.

@param {CartographicRectangle} rectangle A rectangle to enclose in rectangle.
@param {CartographicRectangle} CartographicotherRectangle A rectangle to enclose in a rectangle.
@param {CartographicRectangle} [result] The object onto which to store the result.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if none was provided.

##### expand(rectangle, cartographic, result)

Computes a rectangle by enlarging the provided rectangle until it contains the provided cartographic.

@param {CartographicRectangle} rectangle A rectangle to expand.
@param {Cartographic} cartographic A cartographic to enclose in a rectangle.
@param {CartographicRectangle} [result] The object onto which to store the result.
@returns {CartographicRectangle} The modified result parameter or a new CartographicRectangle instance if one was not provided.

##### contains(rectangle, cartographic)

Returns true if the cartographic is on or inside the rectangle, false otherwise.

@param {CartographicRectangle} rectangle The rectangle
@param {Cartographic} cartographic The cartographic to test.
@returns {Boolean} true if the provided cartographic is inside the rectangle, false otherwise.

##### subsample(rectangle, ellipsoid, surfaceHeight, result)

Samples a rectangle so that it includes a list of Cartesian points suitable for passing to
{@link BoundingSphere#fromPoints}.  Sampling is necessary to account
for rectangles that cover the poles or cross the equator.

@param {CartographicRectangle} rectangle The rectangle to subsample.
@param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
@param {Number} [surfaceHeight=0.0] The height of the rectangle above the ellipsoid.
@param {Cartesian3[]} [result] The array of Cartesians onto which to store the result.
@returns {Cartesian3[]} The modified result parameter or a new Array of Cartesians instances if none was provided.


The largest possible rectangle.

