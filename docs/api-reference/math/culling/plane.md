# Plane

A plane in Hessian Normal Form defined by
<pre>
ax + by + cz + d = 0
</pre>
where (a, b, c) is the plane's `normal`, d is the signed `distance` to the plane, and (x, y, z) is any point on the plane.

## Usage

```js
// The plane x=0
var plane = new Plane(`Vector3`.UNIT_X, 0.0);
```

```js
var point = `Vector3`.fromDegrees(-72.0, 40.0);
var normal = ellipsoid.geodeticSurfaceNormal(point);
var tangentPlane = Plane.fromPointNormal(point, normal);
```

## Static Fields

#### ORIGIN\_XY\_PLANE: Plane (readonly)

The XY plane passing through the origin, with normal in positive Z.

#### ORIGIN\_YZ\_PLANE: Plane (readonly)

The YZ plane passing through the origin, with normal in positive X.

#### ORIGIN\_ZX\_PLANE: Plane (readonly)

The ZX plane passing through the origin, with normal in positive Y.

## Fields

#### normal: Vector3

The plane's normal.

#### distance: Number

The shortest distance from the origin to the plane. The sign of `distance` determines which side of the plane the origin is on. If `distance` is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin.

## Methods

#### constructor(normal : Number[3], distance : Number)

- `Vector3` normal The plane's normal (normalized).
- Number distance The shortest distance from the origin to the plane. The sign of `distance` determines which side of the plane the origin is on. If `distance` is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin.

Throws
- Normal must be normalized


#### Plane.fromPointNormal(point, normal, result)

Creates a plane from a normal and a point on the plane.

- `Vector3` point The point on the plane.
- `Vector3` normal The plane's normal (normalized).
- Plane [result] The object onto which to store the result.

Returns
- Plane A new plane instance or the modified result parameter.

Throws
- Normal must be normalized

#### Plane.fromCartesian4(coefficients, result)

Creates a plane from the general equation

- Cartesian4 coefficients The plane's normal (normalized).
- Plane [result] The object onto which to store the result.

Returns
- Plane A new plane instance or the modified result parameter.

Throws
- Normal must be normalized

#### Plane.clone(plane, result)

Duplicates a Plane instance.

- Plane plane The plane to duplicate.
- Plane [result] The object onto which to store the result.

Returns
- Plane The modified result parameter or a new Plane instance if one was not provided.

#### Plane.equals(left, right)

Compares the provided Planes by normal and distance and returns `true` if they are equal, `false` otherwise.

- Plane left The first plane.
- Plane right The second plane.

Returns
- Boolean `true` if left and right are equal, `false` otherwise.

#### getPointDistance(point) : Number

Computes the signed shortest distance of a point to a plane. The sign of the distance determines which side of the plane the point is on. If the distance is positive, the point is in the half-space in the direction of the normal; if negative, the point is in the half-space opposite to the normal; if zero, the plane passes through the point.

- Plane plane The plane.
- `Vector3` point The point.

Returns
- Number The signed shortest distance of the point to the plane.

#### projectPointOntoPlane(point : Number[3] [, result : Number[3]]) : Number[3]

Projects a point onto the plane.
- Plane plane The plane to project the point onto
- `point` The point to project onto the plane
- `result` The result point. If undefined, a new `Vector3` will be created.

Returns
- The modified result parameter or a new `Vector3` instance if one was not provided.

#### transform(transform, result) : Plane

Transforms the plane by the given transformation matrix.

- Plane plane The plane.
- Matrix4 transform The transformation matrix.
- Plane [result] The object into which to store the result.

Returns
- Plane The plane transformed by the given transformation matrix.

## Attribution

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
