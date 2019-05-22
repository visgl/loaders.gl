# BoundingSphere

A bounding sphere with a center and a radius.
/\*

## Usage

Create a bounding sphere around the unit cube
```js
var sphere = new BoundingSphere.fromCornerPoints(
  [-0.5, -0.5, -0.5],
  [0.5, 0.5, 0.5]
);
```

Creates a bounding sphere encompassing an ellipsoid.
```js
var boundingSphere = BoundingSphere.fromEllipsoid(ellipsoid);
```

Sort bounding spheres from back to front
```js
spheres.sort(
  (a, b) => b.distanceSquaredTo(b, camera.positionWC) - a.distanceSquaredTo(a.camera.positionWC)
);
```

## Global Functions

##### makeBoundingSphereFromPoints(positions, result) : BoundingSphere

 * Computes a tight-fitting bounding sphere enclosing a list of 3D Cartesian points.
 * The bounding sphere is computed by running two algorithms, a naive algorithm and
 * Ritter's algorithm. The smaller of the two spheres is used to ensure a tight fit.
 *
 * @param {Cartesian3[]} [positions] An array of points that the bounding sphere will enclose.  Each point must have <code>x</code>, <code>y</code>, and <code>z</code> properties.
 * @param {BoundingSphere} [result] The object onto which to store the result.
 * @returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
 *
 * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}


    BoundingSphere.fromVertices = function(positions, center, stride, result) {
Computes a tight-fitting bounding sphere enclosing a list of 3D points, where the points are
stored in a flat array in X, Y, Z, order.  The bounding sphere is computed by running two
algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to
ensure a tight fit.

@param {Number[]} [positions] An array of points that the bounding sphere will enclose.  Each point
       is formed from three elements in the array in the order X, Y, Z.
@param {Cartesian3} [center=Cartesian3.ZERO] The position to which the positions are relative, which need not be the
       origin of the coordinate system.  This is useful when the positions are to be used for
       relative-to-center (RTC) rendering.
@param {Number} [stride=3] The number of array elements per vertex.  It must be at least 3, but it may
       be higher.  Regardless of the value of this parameter, the X coordinate of the first position
       is at array index 0, the Y coordinate is at array index 1, and the Z coordinate is at array index
       2.  When stride is 3, the X coordinate of the next position then begins at array index 3.  If
       the stride is 5, however, two array elements are skipped and the next position begins at array
       index 5.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.

@example
// Compute the bounding sphere from 3 positions, each specified relative to a center.
// In addition to the X, Y, and Z coordinates, the points array contains two additional
// elements per point which are ignored for the purpose of computing the bounding sphere.
var center = new Cartesian3(1.0, 2.0, 3.0);
var points = [1.0, 2.0, 3.0, 0.1, 0.2,
              4.0, 5.0, 6.0, 0.1, 0.2,
              7.0, 8.0, 9.0, 0.1, 0.2];
var sphere = BoundingSphere.fromVertices(points, center, 5);

@see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}

    BoundingSphere.fromRectangle2D = function(rectangle, projection, result) {
Computes a bounding sphere from a rectangle projected in 2D.

@param {Rectangle} [rectangle] The rectangle around which to create a bounding sphere.
@param {Object} [projection=GeographicProjection] The projection used to project the rectangle into 2D.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.fromRectangleWithHeights2D = function(rectangle, projection, minimumHeight, maximumHeight, result) {
Computes a bounding sphere from a rectangle projected in 2D.  The bounding sphere accounts for the
object's minimum and maximum heights over the rectangle.

@param {Rectangle} [rectangle] The rectangle around which to create a bounding sphere.
@param {Object} [projection=GeographicProjection] The projection used to project the rectangle into 2D.
@param {Number} [minimumHeight=0.0] The minimum height over the rectangle.
@param {Number} [maximumHeight=0.0] The maximum height over the rectangle.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.fromRectangle3D = function(rectangle, ellipsoid, surfaceHeight, result) {
Computes a bounding sphere from a rectangle in 3D. The bounding sphere is created using a subsample of points
on the ellipsoid and contained in the rectangle. It may not be accurate for all rectangles on all types of ellipsoids.

@param {Rectangle} [rectangle] The valid rectangle used to create a bounding sphere.
@param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid used to determine positions of the rectangle.
@param {Number} [surfaceHeight=0.0] The height above the surface of the ellipsoid.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

#### BoundingSphere.fromEncodedCartesianVertices = function(positionsHigh, positionsLow, result) {
 * Computes a tight-fitting bounding sphere enclosing a list of {@link EncodedCartesian3}s, where the points are
 * stored in parallel flat arrays in X, Y, Z, order.  The bounding sphere is computed by running two
 * algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to
 * ensure a tight fit.
 *
 * @param {Number[]} [positionsHigh] An array of high bits of the encoded cartesians that the bounding sphere will enclose.  Each point
 *        is formed from three elements in the array in the order X, Y, Z.
 * @param {Number[]} [positionsLow] An array of low bits of the encoded cartesians that the bounding sphere will enclose.  Each point
 *        is formed from three elements in the array in the order X, Y, Z.
 * @param {BoundingSphere} [result] The object onto which to store the result.
 * @returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
 *
 * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}



## Fields

### center : Vector3

The center point of the sphere.

### radius : Number

The radius of the sphere.

## Members

### constructor

// @param {Cartesian3} [center=Cartesian3.ZERO] The center of the bounding sphere.
// @param {Number} [radius=0.0] The radius of the bounding sphere.
//
// @see AxisAlignedBoundingBox
// @see BoundingRectangle
// @see Packable

Computes a tight-fitting bounding sphere enclosing the provided oriented bounding box. \*
@param {OrientedBoundingBox} orientedBoundingBox The oriented bounding box.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.


 * Computes a bounding sphere from the corner points of an axis-aligned bounding box.  The sphere
 * tighly and fully encompases the box.
 *
 * @param {Cartesian3} [corner] The minimum height over the rectangle.
 * @param {Cartesian3} [oppositeCorner] The maximum height over the rectangle.
 * @param {BoundingSphere} [result] The object onto which to store the result.
 * @returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
 *
 * @example
 * // Create a bounding sphere around the unit cube
 * var sphere = BoundingSphere.fromCornerPoints(new Cartesian3(-0.5, -0.5, -0.5), new Cartesian3(0.5, 0.5, 0.5));
BoundingSphere.fromCornerPoints = function(corner, oppositeCorner, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('corner', corner);
    Check.typeOf.object('oppositeCorner', oppositeCorner);
    //>>includeEnd('debug');

    if (!defined(result)) {
        result = new BoundingSphere();
    }

    var center = Cartesian3.midpoint(corner, oppositeCorner, result.center);
    result.radius = Cartesian3.distance(center, oppositeCorner);
    return result;
};

Creates a bounding sphere encompassing an ellipsoid.

@param {Ellipsoid} ellipsoid The ellipsoid around which to create a bounding sphere.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

@example
var boundingSphere = BoundingSphere.fromEllipsoid(ellipsoid);
    BoundingSphere.fromEllipsoid = function(ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('ellipsoid', ellipsoid);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new BoundingSphere();
        }

        Cartesian3.clone(Cartesian3.ZERO, result.center);
        result.radius = ellipsoid.maximumRadius;
        return result;
    };

    BoundingSphere.fromBoundingSpheres = function(boundingSpheres, result) {
Computes a tight-fitting bounding sphere enclosing the provided array of bounding spheres.

@param {BoundingSphere[]} [boundingSpheres] The array of bounding spheres.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
}


    BoundingSphere.fromOrientedBoundingBox = function(orientedBoundingBox, result) {
Computes a tight-fitting bounding sphere enclosing the provided oriented bounding box.

@param {OrientedBoundingBox} orientedBoundingBox The oriented bounding box.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.clone = function(sphere, result) {
Duplicates a BoundingSphere instance.

@param {BoundingSphere} sphere The bounding sphere to duplicate.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided. (Returns undefined if sphere is undefined)

Retrieves an instance from a packed array.

@param {Number[]} array The packed array.
@param {Number} [startingIndex=0] The starting index of the element to be unpacked.
@param {BoundingSphere} [result] The object into which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
    BoundingSphere.unpack = function(array, startingIndex, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('array', array);
        //>>includeEnd('debug');

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new BoundingSphere();
        }

        var center = result.center;
        center.x = array[startingIndex++];
        center.y = array[startingIndex++];
        center.z = array[startingIndex++];
        result.radius = array[startingIndex];
        return result;
    };

    BoundingSphere.union = function(left, right, result) {
Computes a bounding sphere that contains both the left and right bounding spheres.

@param {BoundingSphere} left A sphere to enclose in a bounding sphere.
@param {BoundingSphere} right A sphere to enclose in a bounding sphere.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.expand = function(sphere, point, result) {
Computes a bounding sphere by enlarging the provided sphere to contain the provided point.

@param {BoundingSphere} sphere A sphere to expand.
@param {Cartesian3} point A point to enclose in a bounding sphere.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.intersectPlane = function(sphere, plane) {
Determines which side of a plane a sphere is located.

@param {BoundingSphere} sphere The bounding sphere to test.
@param {Plane} plane The plane to test against.
@returns {Intersect} {@link Intersect.INSIDE} if the entire sphere is on the side of the plane
                     the normal is pointing, {@link Intersect.OUTSIDE} if the entire sphere is
                     on the opposite side, and {@link Intersect.INTERSECTING} if the sphere
                     intersects the plane.

    BoundingSphere.transform = function(sphere, transform, result) {
Applies a 4x4 affine transformation matrix to a bounding sphere.

@param {BoundingSphere} sphere The bounding sphere to apply the transformation to.
@param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

    BoundingSphere.distanceSquaredTo = function(sphere, cartesian) {
Computes the estimated distance squared from the closest point on a bounding sphere to a point.

@param {BoundingSphere} sphere The sphere.
@param {Cartesian3} cartesian The point
@returns {Number} The estimated distance squared from the bounding sphere to the point.

@example
// Sort bounding spheres from back to front
spheres.sort(function(a, b) {
    return BoundingSphere.distanceSquaredTo(b, camera.positionWC) - BoundingSphere.distanceSquaredTo(a, camera.positionWC);
});
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('sphere', sphere);
        Check.typeOf.object('cartesian', cartesian);
        //>>includeEnd('debug');

        var diff = Cartesian3.subtract(sphere.center, cartesian, distanceSquaredToScratch);
        return Cartesian3.magnitudeSquared(diff) - sphere.radius * sphere.radius;
    };

    BoundingSphere.transformWithoutScale = function(sphere, transform, result) {
Applies a 4x4 affine transformation matrix to a bounding sphere where there is no scale
The transformation matrix is not verified to have a uniform scale of 1.
This method is faster than computing the general bounding sphere transform using {@link BoundingSphere.transform}.

@param {BoundingSphere} sphere The bounding sphere to apply the transformation to.
@param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.

@example
var modelMatrix = Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid);
var boundingSphere = new BoundingSphere();
var newBoundingSphere = BoundingSphere.transformWithoutScale(boundingSphere, modelMatrix);
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('sphere', sphere);
        Check.typeOf.object('transform', transform);
        //>>includeEnd('debug');

        if (!defined(result)) {
            result = new BoundingSphere();
        }

        result.center = Matrix4.multiplyByPoint(transform, sphere.center, result.center);
        result.radius = sphere.radius;

        return result;
    };

    BoundingSphere.computePlaneDistances = function(sphere, position, direction, result) {
The distances calculated by the vector from the center of the bounding sphere to position projected onto direction
plus/minus the radius of the bounding sphere.
<br>
If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the
closest and farthest planes from position that intersect the bounding sphere.

@param {BoundingSphere} sphere The bounding sphere to calculate the distance to.
@param {Cartesian3} position The position to calculate the distance from.
@param {Cartesian3} direction The direction from position.
@param {Interval} [result] A Interval to store the nearest and farthest distances.
@returns {Interval} The nearest and farthest distances on the bounding sphere from position in direction.


    BoundingSphere.projectTo2D = function(sphere, projection, result) {
Creates a bounding sphere in 2D from a bounding sphere in 3D world coordinates.

@param {BoundingSphere} sphere The bounding sphere to transform to 2D.
@param {Object} [projection=GeographicProjection] The projection to 2D.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.



    BoundingSphere.equals = function(left, right) {
Compares the provided BoundingSphere componentwise and returns
<code>true</code> if they are equal, <code>false</code> otherwise.

@param {BoundingSphere} [left] The first BoundingSphere.
@param {BoundingSphere} [right] The second BoundingSphere.
@returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
                Cartesian3.equals(left.center, right.center) &&
                left.radius === right.radius);
    };

    BoundingSphere.prototype.intersectPlane = function(plane) {
Determines which side of a plane the sphere is located.

@param {Plane} plane The plane to test against.
@returns {Intersect} {@link Intersect.INSIDE} if the entire sphere is on the side of the plane
                     the normal is pointing, {@link Intersect.OUTSIDE} if the entire sphere is
                     on the opposite side, and {@link Intersect.INTERSECTING} if the sphere
                     intersects the plane.
        return BoundingSphere.intersectPlane(this, plane);
    };

    BoundingSphere.prototype.distanceSquaredTo = function(cartesian) {
Computes the estimated distance squared from the closest point on a bounding sphere to a point.

@param {Cartesian3} cartesian The point
@returns {Number} The estimated distance squared from the bounding sphere to the point.

@example
// Sort bounding spheres from back to front
spheres.sort(function(a, b) {
    return b.distanceSquaredTo(camera.positionWC) - a.distanceSquaredTo(camera.positionWC);
});


    BoundingSphere.prototype.computePlaneDistances = function(position, direction, result) {
The distances calculated by the vector from the center of the bounding sphere to position projected onto direction
plus/minus the radius of the bounding sphere.
<br>
If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the
closest and farthest planes from position that intersect the bounding sphere.

@param {Cartesian3} position The position to calculate the distance from.
@param {Cartesian3} direction The direction from position.
@param {Interval} [result] A Interval to store the nearest and farthest distances.
@returns {Interval} The nearest and farthest distances on the bounding sphere from position in direction.
        return BoundingSphere.computePlaneDistances(this, position, direction, result);
    };


Compares this BoundingSphere against the provided BoundingSphere componentwise and returns
<code>true</code> if they are equal, <code>false</code> otherwise.

@param {BoundingSphere} [right] The right hand side BoundingSphere.
@returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
    BoundingSphere.prototype.equals = function(right) {
        return BoundingSphere.equals(this, right);
    };

Duplicates this BoundingSphere instance.

@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
    BoundingSphere.prototype.clone = function(result) {
        return BoundingSphere.clone(this, result);
    };

Computes the radius of the BoundingSphere.
@returns {Number} The radius of the BoundingSphere.
    BoundingSphere.prototype.volume = function() {
        var radius = this.radius;
        return volumeConstant * radius * radius * radius;
    };

    return BoundingSphere;
});