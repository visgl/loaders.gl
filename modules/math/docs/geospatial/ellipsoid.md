# Ellipsoid

A quadratic surface defined in Cartesian coordinates by the equation
<code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>. Primarily used to represent the shape of planetary bodies.

Rather than constructing this object directly, one of the provided constants is

## Usage

Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.

```js
var position = new Cartographic(Math.toRadians(21), Math.toRadians(78), 5000);
var cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(position);
```

```js
var position = new Vector3(17832.12, 83234.52, 952313.73);
var cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(position);
```

## Static Fields

### Ellipsoid.WGS84 : Ellipsoid (readonly)

An Ellipsoid instance initialized to the WGS84 standard.

### Ellipsoid.UNIT_SPHERE : Ellipsoid (readonly)

An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).

### Ellipsoid.MOON : Ellipsoid (readonly)

An Ellipsoid instance initialized to a sphere with the lunar radius.

## Members

### radii : Vector3 (readonly)

Gets the radii of the ellipsoid.

### radiiSquared : Vector3 (readonly)

Gets the squared radii of the ellipsoid.

### radiiToTheFourth : Vector3 (readonly)

Gets the radii of the ellipsoid raise to the fourth power.

### oneOverRadii : Vector3 (readonly)

Gets one over the radii of the ellipsoid.

### oneOverRadiiSquared : Vector3 (readonly)

Gets one over the squared radii of the ellipsoid.

### minimumRadius : Number (readonly)

Gets the minimum radius of the ellipsoid.

### maximumRadius : Number

Gets the maximum radius of the ellipsoid.

## Methods

### constructor(x : Number, y : Number, z : Number)

- `x`=`0` The radius in the x direction.
- `y`=`0` The radius in the y direction.
- `z`=`0` The radius in the z direction.

Throws

- All radii components must be greater than or equal to zero.

### fromVector3(cartesian)

Computes an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions.

- {Vector3} [cartesian=Vector3.ZERO] The ellipsoid's radius in the x, y, and z directions.
- {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
  instance should be created.
  Returns
- {Ellipsoid} A new Ellipsoid instance.
  Throws
- All radii components must be greater than or equal to zero.

### clone(ellipsoid)

Duplicates an Ellipsoid instance.

- {Ellipsoid} ellipsoid The ellipsoid to duplicate.
- {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
  instance should be created.
  Returns
- {Ellipsoid} The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)

### equals(right)

Compares this Ellipsoid against the provided Ellipsoid componentwise and returns
<code>true</code> if they are equal, <code>false</code> otherwise. \*

- {Ellipsoid} [right] The other Ellipsoid.
  Returns
- {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.

### toString()

Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'. \*
Returns

- {String} A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.

### geocentricSurfaceNormal = Vector3.normalize;

Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.
@function

- {Vector3} cartesian The Cartesian for which to to determine the geocentric normal.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter or a new Vector3 instance if none was provided.

### geodeticSurfaceNormalCartographic(cartographic, result)

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- {Cartographic} cartographic The cartographic position for which to to determine the geodetic normal.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter or a new Vector3 instance if none was provided.

### geodeticSurfaceNormal(cartesian, result)

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- {Vector3} cartesian The Cartesian position for which to to determine the surface normal.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter or a new Vector3 instance if none was provided.

### cartographicToCartesian(cartographic, result = new Vector3())

Converts the provided cartographic to Cartesian representation.

- {Cartographic} cartographic The cartographic position.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter or a new Vector3 instance if none was provided.

### cartesianToCartographic(cartesian, result)

Converts the provided cartesian to cartographic representation.
The cartesian is undefined at the center of the ellipsoid.

- {Vector3} cartesian The Cartesian position to convert to cartographic representation.
- {Cartographic} [result] The object onto which to store the result.
  Returns
- {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.

### scaleToGeodeticSurface(cartesian, result)

Scales the provided Cartesian position along the geodetic surface normal
so that it is on the surface of this ellipsoid. If the position is
at the center of the ellipsoid, this function returns undefined.

- {Vector3} cartesian The Cartesian position to scale.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter, a new Vector3 instance if none was provided, or undefined if the position is at the center.

### scaleToGeocentricSurface(cartesian, result)

Scales the provided Cartesian position along the geocentric surface normal
so that it is on the surface of this ellipsoid.

- {Vector3} cartesian The Cartesian position to scale.
- {Vector3} [result] The object onto which to store the result.
  Returns
- {Vector3} The modified result parameter or a new Vector3 instance if none was provided.

### transformPositionToScaledSpace(position, result = new Vector3())

Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying its components by the result of {@link Ellipsoid#oneOverRadii}.

- {Vector3} position The position to transform.
- {Vector3} [result] The position to which to copy the result, or undefined to create and return a new instance.

Returns

- {Vector3} The position expressed in the scaled space. The returned instance is the one passed as the result parameter if it is not undefined, or a new instance of it is.

### transformPositionFromScaledSpace(position, result = new Vector3())

Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying its components by the result of {@link Ellipsoid#radii}.

- {Vector3} position The position to transform.
- {Vector3} [result] The position to which to copy the result, or undefined to create and return a new instance.

Returns

- {Vector3} The position expressed in the unscaled space. The returned instance is the one passed as the result parameter if it is not undefined, or a new instance of it is.

### getSurfaceNormalIntersectionWithZAxis(position, buffer, result)

Computes a point which is the intersection of the surface normal with the z-axis.

- {Vector3} position the position. must be on the surface of the ellipsoid.
- {Number} [buffer = 0.0] A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.

- {Vector3} [result] The cartesian to which to copy the result, or undefined to create and return a new instance.

Returns

- {Vector3 | undefined} the intersection point if it's inside the ellipsoid, undefined otherwise

Throws

- position is required.
- Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y).
- Ellipsoid.radii.z must be greater than 0.

Notes:

- In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
- In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
- Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2

## Attribution

This class was ported from Cesium under the Apache 2 License.
