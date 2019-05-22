# Ellipsoid

A quadratic surface defined in Cartesian coordinates by the equation `(x / a)^2 + (y / b)^2 + (z / c)^2 = 1`. Primarily used to represent the shape of planetary bodies.

The main use of this class is to convert between the "cartesian" and "cartographic" coordinate systems.

Rather than constructing this object directly, one of the provided constants is used.

## Usage

Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.

```js
const cartographicPosition = [Math.toRadians(21), Math.toRadians(78), 5000];
const cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(position);
```

```js
const cartesianPosition = new [17832.12, 83234.52, 952313.73];
const cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(position);
```

## Static Fields

#### Ellipsoid.WGS84 : Ellipsoid (readonly)

An Ellipsoid instance initialized to the WGS84 standard.

#### Ellipsoid.UNIT_SPHERE : Ellipsoid (readonly)

An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).

#### Ellipsoid.MOON : Ellipsoid (readonly)

An Ellipsoid instance initialized to a sphere with the lunar radius.

## Members

#### radii : Vector3 (readonly)

Gets the radii of the ellipsoid.

#### radiiSquared : Vector3 (readonly)

Gets the squared radii of the ellipsoid.

#### radiiToTheFourth : Vector3 (readonly)

Gets the radii of the ellipsoid raise to the fourth power.

#### oneOverRadii : Vector3 (readonly)

Gets one over the radii of the ellipsoid.

#### oneOverRadiiSquared : Vector3 (readonly)

Gets one over the squared radii of the ellipsoid.

#### minimumRadius : Number (readonly)

Gets the minimum radius of the ellipsoid.

#### maximumRadius : Number

Gets the maximum radius of the ellipsoid.

## Methods

#### constructor(x : Number, y : Number, z : Number)

- `x`=`0` The radius in the x direction.
- `y`=`0` The radius in the y direction.
- `z`=`0` The radius in the z direction.

Throws

- All radii components must be greater than or equal to zero.

#### clone() : Ellipsoid

Duplicates an Ellipsoid instance.

- {Ellipsoid} [result] Optional object onto which to store the result, or undefined if a new
  instance should be created.

Returns
- The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)

#### equals(right)

Compares this Ellipsoid against the provided Ellipsoid componentwise and returns `true` if they are equal, `false` otherwise. \*

- {Ellipsoid} [right] The other Ellipsoid. used.

Returns - {Boolean} `true` if they are equal, `false` otherwise.

#### toString() : String

Creates a string representing this Ellipsoid in the format  used.'(radii.x, radii.y, radii.z)'. \*

Returns

- A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.

#### geocentricSurfaceNormal(cartesian : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.

- `cartesian` - The WSG84 cartesian coordinate for which to to determine the geocentric normal.
- `result` - Optional object onto which to store the result.

Returns

- The modified result parameter or a new `Vector3` instance if none was provided.

#### geodeticSurfaceNormalCartographic(cartographic : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- `cartographic` The cartographic position for which to to determine the geodetic normal.
- `result` Optional object onto which to store the result.

Returns

The modified result parameter or a new `Vector3` instance if none was provided.

#### geodeticSurfaceNormal(cartesian : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- `cartesian` The Cartesian position for which to to determine the surface normal.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Vector3` instance if none was provided.

#### cartographicToCartesian(cartographic : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Converts the provided cartographic to Cartesian representation.

- `cartographic` The cartographic position.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Vector3` instance if none was provided.

#### cartesianToCartographic(cartesian : Number[3] [, result : Number[3]]) : Vector3 | Number[3] | `undefined`

Converts the provided cartesian to cartographic representation. The cartesian is `undefined` at the center of the ellipsoid.

- `cartesian` The Cartesian position to convert to cartographic representation.
- `result` Optional object onto which to store the result.

Returns

- The modified result parameter, new `Vector3` instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.

#### scaleToGeodeticSurface(cartesian : Number[3] [, result : Number[3]]) : Vector3 | Number[3] | `undefined`

Scales the provided Cartesian position along the geodetic surface normal so that it is on the surface of this ellipsoid. If the position is at the center of the ellipsoid, this function returns `undefined`.

- `cartesian` The Cartesian position to scale.
- `result` Optional object onto which to store the result.

Returns

- The modified result parameter, a new `Vector3` instance if none was provided, or undefined if the position is at the center.

#### scaleToGeocentricSurface(cartesian : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Scales the provided Cartesian position along the geocentric surface normal so that it is on the surface of this ellipsoid.

- `cartesian` The Cartesian position to scale.
- `result` Optional object onto which to store the result.

Returns
- The modified `result` parameter or a new `Vector3` instance if none was provided.

#### transformPositionToScaledSpace(position : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying its components by the result of `Ellipsoid.oneOverRadii`.

- `position` The position to transform.
- `result` Optional array into which to copy the result.

Returns

- The position expressed in the scaled space. The returned instance is the one passed as the `result` parameter if it is not undefined, or a new instance of it is.

#### transformPositionFromScaledSpace(position : Number[3] [, result : Number[3]]) : Vector3 | Number[3]

Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying its components by the result of `Ellipsoid.radii`.

- `position` The position to transform.
- `result` Optional array to which to copy the result.

Returns

- The position expressed in the unscaled space. The returned array is the one passed as the `result` parameter, or a new `Vector3` instance.

#### getSurfaceNormalIntersectionWithZAxis(position, buffer, result) : | undefined

Computes a point which is the intersection of the surface normal with the z-axis.

- `position` the position. must be on the surface of the ellipsoid.
- `buffer`=`0.0` A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.
- `result` Optional array into which to copy the result.

Returns

- The intersection point if it's inside the ellipsoid, `undefined` otherwise.

Throws

- `position` is required.
- `Ellipsoid` must be an ellipsoid of revolution (`radii.x == radii.y`).
- Ellipsoid.radii.z must be greater than 0.

Notes:

- In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
- In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
- Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2

## Attribution

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
