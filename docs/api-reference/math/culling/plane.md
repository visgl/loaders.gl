# Plane

A plane in Hessian Normal Form defined by

<pre>
ax + by + cz + d = 0
</pre>

where (a, b, c) is the plane's <code>normal</code>, d is the signed
<code>distance</code> to the plane, and (x, y, z) is any point on
the plane.

```js
```

## Static Fields

### ORIGIN_XY_PLANE: Plane (readonly)

The XY plane passing through the origin, with normal in positive Z.

### ORIGIN_YZ_PLANE: Plane (readonly)

The YZ plane passing through the origin, with normal in positive X.

### ORIGIN_ZX_PLANE: Plane (readonly)

The ZX plane passing through the origin, with normal in positive Y.

## Fields

### normal: Vector3

The plane's normal.

### distance: Vector3

The shortest distance from the origin to the plane. The sign of
<code>distance</code> determines which side of the plane the origin
is on. If <code>distance</code> is positive, the origin is in the half-space
in the direction of the normal; if negative, the origin is in the half-space
opposite to the normal; if zero, the plane passes through the origin.

## Methods

###constructor

@param {Cartesian3} normal The plane's normal (normalized).
@param {Number} distance The shortest distance from the origin to the plane. The sign of
<code>distance</code> determines which side of the plane the origin
is on. If <code>distance</code> is positive, the origin is in the half-space
in the direction of the normal; if negative, the origin is in the half-space
opposite to the normal; if zero, the plane passes through the origin.

@example
// The plane x=0
var plane = new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0);

@exception {DeveloperError} Normal must be normalized

export default function Plane(normal, distance) {
assert(Number.isFinite(distance));

    @type {Number}

    	this.distance = distance;

}

Plane.fromPointNormal = function(point, normal, result) {

Creates a plane from a normal and a point on the plane.

@param {Cartesian3} point The point on the plane.
@param {Cartesian3} normal The plane's normal (normalized).
@param {Plane} [result] The object onto which to store the result.
@returns {Plane} A new plane instance or the modified result parameter.

@example
var point = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
var normal = ellipsoid.geodeticSurfaceNormal(point);
var tangentPlane = Cesium.Plane.fromPointNormal(point, normal);

@exception {DeveloperError} Normal must be normalized

Plane.fromCartesian4 = function(coefficients, result) {

Creates a plane from the general equation

@param {Cartesian4} coefficients The plane's normal (normalized).
@param {Plane} [result] The object onto which to store the result.
@returns {Plane} A new plane instance or the modified result parameter.

@exception {DeveloperError} Normal must be normalized

### Plane.clone = function(plane, result) {

Duplicates a Plane instance.

@param {Plane} plane The plane to duplicate.
@param {Plane} [result] The object onto which to store the result.
@returns {Plane} The modified result parameter or a new Plane instance if one was not provided.

### Plane.getPointDistance = function(plane, point) {

Computes the signed shortest distance of a point to a plane.
The sign of the distance determines which side of the plane the point
is on. If the distance is positive, the point is in the half-space
in the direction of the normal; if negative, the point is in the half-space
opposite to the normal; if zero, the plane passes through the point.

@param {Plane} plane The plane.
@param {Cartesian3} point The point.
@returns {Number} The signed shortest distance of the point to the plane.

### Plane.projectPointOntoPlane = function(plane, point, result) {

Projects a point onto the plane.
@param {Plane} plane The plane to project the point onto
@param {Cartesian3} point The point to project onto the plane
@param {Cartesian3} [result] The result point. If undefined, a new Cartesian3 will be created.
@returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.

### Plane.transform = function(plane, transform, result) {

Transforms the plane by the given transformation matrix.

@param {Plane} plane The plane.
@param {Matrix4} transform The transformation matrix.
@param {Plane} [result] The object into which to store the result.
@returns {Plane} The plane transformed by the given transformation matrix.

### Plane.equals = function(left, right) {

Compares the provided Planes by normal and distance and returns
<code>true</code> if they are equal, <code>false</code> otherwise.

@param {Plane} left The first plane.
@param {Plane} right The second plane.
@returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.

## Attribution

This class was ported from Cesium under the Apache 2 License.
