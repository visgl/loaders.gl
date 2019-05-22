# OrientedBoundingBox

An OrientedBoundingBox is a closed and convex cuboid. It can provide a tighter bounding volume than a bounding sphere or an axis aligned bounding box in many cases.

# Usage

Create an OrientedBoundingBox using a transformation matrix, a position where the box will be translated, and a scale.

```js
import {Vector3} from 'math.gl';
import {OrientedBoundingBox} from '@math.gl/culling';

const center = new Vector3(1.0, 0.0, 0.0);
const halfAxes = new Matrix3().fromScale([1.0, 3.0, 2.0]);
const box = new OrientedBoundingBox(center, halfAxes);
```

Sort bounding boxes from back to front

```js
boxes.sort(
  (boxA, boxB) =>
    boxB.distanceSquaredTo(camera.positionWC) - boxA.distanceSquaredTo(camera.positionWC)
);
```

Compute an oriented bounding box enclosing two points.

```js
// import {makeBoundingBoxFromPoints} from '@math.gl/culling';
const box = makeBoundingBoxFromPoints([[2, 0, 0], [-2, 0, 0]]);
```

## Global Functions

### makeBoundingBoxFromPoints(positions : Array[3][]) : OrientedBoundingBox

Computes an instance of an OrientedBoundingBox of the given positions.
This is an implementation of Stefan Gottschalk's [Collision Queries using Oriented Bounding Boxes](http://gamma.cs.unc.edu/users/gottschalk/main.pdf) (PHD thesis).

- `positions` List of `Vector3` points that the bounding box will enclose.

### makeBoundingBoxfromRectangle(rectangle : Rectangle [, minimumHeight : Number, maximumHeight : Number, ellipsoid : Ellipsoid]) : OrientedBoundingBox

Computes an `OrientedBoundingBox` that bounds a `Rectangle` on the surface of an `Ellipsoid`.

There are no guarantees about the orientation of the bounding box.

- `rectangle` The cartographic rectangle on the surface of the ellipsoid.
- `minimumHeight`=`0.0` The minimum height (elevation) within the tile.
- `maximumHeight`=`0.0` The maximum height (elevation) within the tile.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the rectangle is defined.
- `result` The object onto which to store the result.

Returns

- The modified result parameter or a new `OrientedBoundingBox` instance if none was provided.

Throws

- `rectangle.width` must be between 0 and pi.
- `rectangle.height` must be between 0 and pi.
- `ellipsoid` must be an ellipsoid of revolution (`radii.x == radii.y`)

## Fields

### center: Vector3 = [0, 0, 0]

The center position of the box.

### halfAxes: Matrix3

The transformation matrix, to rotate the box to the right position.

## Methods

### constructor(center = [0, 0, 0], halfAxes = [0, 0, 0, 0, 0, 0, 0, 0, 0]) {

### constructor

- {Vector3} [center=Vector3.ZERO] The center of the box.
- {Matrix3} [halfAxes=Matrix3.ZERO] The three orthogonal half-axes of the bounding box. Equivalently, the transformation matrix, to rotate and scale a cube centered at the origin.

### clone() : OrientedBoundingBox

Duplicates a OrientedBoundingBox instance.

- `box` The bounding box to duplicate.
- `result` The object onto which to store the result.
  @returns {OrientedBoundingBox} A new OrientedBoundingBox instance.

### equals(left, right) : Boolean

Compares the provided OrientedBoundingBox componentwise and returns `true` if they are equal, `false` otherwise.

- left The first
- right The second

returns `true` if left and right are equal, `false` otherwise.

### intersectPlane(plane : Plane) : Intersect

Determines which side of a plane the oriented bounding box is located.

- `box` The oriented bounding box to test.
- {Plane} plane The plane to test against.

Returns
- `Intersect.INSIDE` if the entire box is on the side of the plane the normal is pointing
- `Intersect.OUTSIDE` if the entire box is on the opposite side, and
- `Intersect.INTERSECTING` if the box intersects the plane.

### distanceTo(point : Number[3]) : Number

Computes the estimated distance from the closest point on a bounding box to a point.

- `point` The point

Returns

- The estimated distance from the bounding sphere to the point.

### distanceSquaredTo(point : Number[3]) : Number

Computes the estimated distance squared from the closest point on a bounding box to a point.

- `point` The point

Returns

- {Number} The estimated distance squared from the bounding sphere to the point.

### computePlaneDistances(position : Number[3], direction : Number[3] [, result : Number[2]]) : Number[2]

The distances calculated by the vector from the center of the bounding box to position projected onto direction.

If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the closest and farthest planes from position that intersect the bounding box.

- `position` The position to calculate the distance from.
- `direction` The direction from position.
- `result` An optional Interval to store the nearest and farthest distances.

Returns

- The nearest and farthest distances on the bounding box from position in direction.

### intersectPlane(plane : Plane) : Intersect

Determines which side of a plane the oriented bounding box is located.

- `plane` The plane to test against.

Returns

- `Intersect.INSIDE` if the entire box is on the side of the plane the normal is pointing
- `Intersect.OUTSIDE` if the entire box is on the opposite side, and
- `Intersect.INTERSECTING` if the box intersects the plane.

### getModelMatrix() : Matrix4

```js
const modelMatrix = Matrix4.fromRotationTranslation(this.boundingVolume.halfAxes, this.boundingVolume.center);
```

## Attribution

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
