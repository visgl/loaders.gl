/* eslint-disable */
import {Vector3, Matrix4} from 'math.gl';
// import Rectangle from './rectangle';

// const defaultProjection = new GeographicProjection();
// const fromRectangle2DLowerLeft = new Vector3();
// const fromRectangle2DUpperRight = new Vector3();
// const fromRectangle2DSouthwest = new Cartographic();
// const fromRectangle2DNortheast = new Cartographic();

// const fromRectangle3DScratch = [];

export default class BoundingSphere {
  constructor(center = [0, 0, 0], radius = 0.0) {
    this.center = new Vector3(center);
    this.radius = radius;
  }

  // Computes a bounding sphere from a rectangle projected in 2D.  The bounding sphere accounts for the
  // object's minimum and maximum heights over the rectangle.
  //    *
  // @param {Rectangle} [rectangle] The rectangle around which to create a bounding sphere.
  // @param {Object} [projection=GeographicProjection] The projection used to project the rectangle into 2D.
  // @param {Number} [minimumHeight=0.0] The minimum height over the rectangle.
  // @param {Number} [maximumHeight=0.0] The maximum height over the rectangle.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  /*
  fromRectangleWithHeights2D(
    rectangle,
    projection = defaultProjection,
    minimumHeight = 0,
    maximumHeight = 0
  ) {
    Rectangle.southwest(rectangle, fromRectangle2DSouthwest);
    fromRectangle2DSouthwest.height = minimumHeight;
    Rectangle.northeast(rectangle, fromRectangle2DNortheast);
    fromRectangle2DNortheast.height = maximumHeight;

    const lowerLeft = projection.project(fromRectangle2DSouthwest, fromRectangle2DLowerLeft);
    const upperRight = projection.project(fromRectangle2DNortheast, fromRectangle2DUpperRight);

    const width = upperRight.x - lowerLeft.x;
    const height = upperRight.y - lowerLeft.y;
    const elevation = upperRight.z - lowerLeft.z;

    this.radius = Math.sqrt(width * width + height * height + elevation * elevation) * 0.5;
    var center = this.center;
    center.x = lowerLeft.x + width * 0.5;
    center.y = lowerLeft.y + height * 0.5;
    center.z = lowerLeft.z + elevation * 0.5;
    return this;
  };

  // Computes a bounding sphere from a rectangle in 3D. The bounding sphere is created using a subsample of points
  // on the ellipsoid and contained in the rectangle. It may not be accurate for all rectangles on all types of ellipsoids.
  //    *
  // @param {Rectangle} [rectangle] The valid rectangle used to create a bounding sphere.
  // @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid used to determine positions of the rectangle.
  // @param {Number} [surfaceHeight=0.0] The height above the surface of the ellipsoid.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  fromRectangle3D(rectangle, ellipsoid = Ellipsoid.WGS84, surfaceHeight = 0.0) {
    // TODO why support null rectangle?
    if (!rectangle) {
      this.center = new Vector3([0, 0, 0]);
      this.radius = 0.0;
      return this;
    }

    const positions = rectangle.subsample(ellipsoid, surfaceHeight);
    return this.fromPoints(positions, this);
  }
  */

  // Computes a bounding sphere from the corner points of an axis-aligned bounding box.  The sphere
  // tighly and fully encompases the box.
  //    *
  // @param {Vector3} [corner] The minimum height over the rectangle.
  // @param {Vector3} [oppositeCorner] The maximum height over the rectangle.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  //    *

  fromCornerPoints(corner, oppositeCorner) {
    this.center = Vector3(corner)
      .add(oppositeCorner)
      .scale(0.5);
    this.radius = Vector3.distance(this.center, oppositeCorner);
    return this;
  }

  /*
Creates a bounding sphere encompassing an ellipsoid.
   *
@param {Ellipsoid} ellipsoid The ellipsoid around which to create a bounding sphere.
@returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
   *
  BoundingSphere.fromEllipsoid = function(ellipsoid) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('ellipsoid', ellipsoid);
    //>>includeEnd('debug');

    if (!defined(this)) {
      this = new BoundingSphere();
    }

    Vector3.clone(Vector3.ZERO, this.center);
    this.radius = ellipsoid.maximumRadius;
    return this;
  };

  var fromBoundingSpheresScratch = new Vector3();

Computes a tight-fitting bounding sphere enclosing the provided array of bounding spheres.
   *
@param {BoundingSphere[]} [boundingSpheres] The array of bounding spheres.
@returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  BoundingSphere.fromBoundingSpheres = function(boundingSpheres) {
    if (!defined(this)) {
      this = new BoundingSphere();
    }

    if (!defined(boundingSpheres) || boundingSpheres.length === 0) {
      this.center = Vector3.clone(Vector3.ZERO, this.center);
      this.radius = 0.0;
      return this;
    }

    var length = boundingSpheres.length;
    if (length === 1) {
      return BoundingSphere.clone(boundingSpheres[0], this);
    }

    if (length === 2) {
      return BoundingSphere.union(boundingSpheres[0], boundingSpheres[1], this);
    }

    var positions = [];
    var i;
    for (i = 0; i < length; i++) {
      positions.push(boundingSpheres[i].center);
    }

    this = BoundingSphere.fromPoints(positions, this);

    var center = this.center;
    var radius = this.radius;
    for (i = 0; i < length; i++) {
      var tmp = boundingSpheres[i];
      radius = Math.max(radius, Vector3.distance(center, tmp.center, fromBoundingSpheresScratch) + tmp.radius);
    }
    this.radius = radius;

    return this;
  };
*/

  // Computes a tight-fitting bounding sphere enclosing the provided oriented bounding box.
  fromOrientedBoundingBox(orientedBoundingBox) {
    const fromOrientedBoundingBoxScratchU = new Vector3();
    const fromOrientedBoundingBoxScratchV = new Vector3();
    const fromOrientedBoundingBoxScratchW = new Vector3();

    const halfAxes = orientedBoundingBox.halfAxes;
    const u = Matrix3.getColumn(halfAxes, 0, fromOrientedBoundingBoxScratchU);
    const v = Matrix3.getColumn(halfAxes, 1, fromOrientedBoundingBoxScratchV);
    const w = Matrix3.getColumn(halfAxes, 2, fromOrientedBoundingBoxScratchW);

    Vector3.add(u, v, u);
    Vector3.add(u, w, u);

    this.center = Vector3.clone(orientedBoundingBox.center, this.center);
    this.radius = Vector3.magnitude(u);

    return this;
  }

  // Compares the provided BoundingSphere componentwise and returns
  // <code>true</code> if they are equal, <code>false</code> otherwise.
  //    *
  // @param {BoundingSphere} [left] The first BoundingSphere.
  // @param {BoundingSphere} [right] The second BoundingSphere.
  // @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
  equals(right) {
    return (
      this === right ||
      (Boolean(right) && this.center.equals(right.center) && this.radius === right.radius)
    );
  }

  // Duplicates a BoundingSphere instance.
  //
  // @returns {BoundingSphere} A new identical `BoundingSphere` instance
  clone() {
    return new BoundingSphere(this.center, this.radius);
  }

  // Computes a bounding sphere that contains both the left and right bounding spheres.
  //
  // @param {BoundingSphere} left A sphere to enclose in a bounding sphere.
  // @param {BoundingSphere} right A sphere to enclose in a bounding sphere.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  union(left, right) {
    const unionScratch = new Vector3();
    const unionScratchCenter = new Vector3();

    const leftCenter = left.center;
    const leftRadius = left.radius;
    const rightCenter = right.center;
    const rightRadius = right.radius;

    const toRightCenter = Vector3.subtract(rightCenter, leftCenter, unionScratch);
    const centerSeparation = Vector3.magnitude(toRightCenter);

    if (leftRadius >= centerSeparation + rightRadius) {
      // Left sphere wins.
      left.clone(this);
      return this;
    }

    if (rightRadius >= centerSeparation + leftRadius) {
      // Right sphere wins.
      right.clone(this);
      return this;
    }

    // There are two tangent points, one on far side of each sphere.
    const halfDistanceBetweenTangentPoints = (leftRadius + centerSeparation + rightRadius) * 0.5;

    // Compute the center point halfway between the two tangent points.
    const center = Vector3.multiplyByScalar(
      toRightCenter,
      (-leftRadius + halfDistanceBetweenTangentPoints) / centerSeparation,
      unionScratchCenter
    );
    Vector3.add(center, leftCenter, center);
    Vector3.clone(center, this.center);
    this.radius = halfDistanceBetweenTangentPoints;

    return this;
  }

  //   var expandScratch = new Vector3();
  // Computes a bounding sphere by enlarging the provided sphere to contain the provided point.
  //    *
  // @param {BoundingSphere} sphere A sphere to expand.
  // @param {Vector3} point A point to enclose in a bounding sphere.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  expand(point) {
    expandScratch.set(point);
    const radius = expandScratch.subtract(center).magnitude();
    if (radius > this.radius) {
      this.radius = radius;
    }
    return this;
  }

  // Determines which side of a plane a sphere is located.
  //    *
  // @param {BoundingSphere} sphere The bounding sphere to test.
  // @param {Plane} plane The plane to test against.
  // @returns {Intersect} {@link Intersect.INSIDE} if the entire sphere is on the side of the plane
  //                      the normal is pointing, {@link Intersect.OUTSIDE} if the entire sphere is
  //                      on the opposite side, and {@link Intersect.INTERSECTING} if the sphere
  //                      intersects the plane.
  intersectPlane(plane) {
    var center = this.center;
    var radius = this.radius;
    var normal = plane.normal;
    var distanceToPlane = Vector3.dot(normal, center) + plane.distance;

    if (distanceToPlane < -radius) {
      // The center point is negative side of the plane normal
      return Intersect.OUTSIDE;
    } else if (distanceToPlane < radius) {
      // The center point is positive side of the plane, but radius extends beyond it; partial overlap
      return Intersect.INTERSECTING;
    }
    return Intersect.INSIDE;
  }

  // Applies a 4x4 affine transformation matrix to a bounding sphere.
  //    *
  // @param {BoundingSphere} sphere The bounding sphere to apply the transformation to.
  // @param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
  // @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  transform(transform) {
    this.center = new Matrix4(transform).transformPoint(this.center);
    this.radius = getMaximumScale(transform) * sphere.radius;
    return this;
  }

  // Computes the estimated distance squared from the closest point on a bounding sphere to a point.
  //    *
  // @param {BoundingSphere} sphere The sphere.
  // @param {Vector3} cartesian The point
  // @returns {Number} The estimated distance squared from the bounding sphere to the point.
  //    *
  distanceSquaredTo(point) {
    const distanceSquaredToScratch = new Vector3();
    const delta = distanceSquaredToScratch.set(this.center).subtract(point);
    return delta.magnitudeSquared() - this.radius * this.radius;
  }
}

/*
  Applies a 4x4 affine transformation matrix to a bounding sphere where there is no scale
  The transformation matrix is not verified to have a uniform scale of 1.
  This method is faster than computing the general bounding sphere transform using {@link BoundingSphere.transform}.
     *
  @param {BoundingSphere} sphere The bounding sphere to apply the transformation to.
  @param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
  @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
     *
  @example
  var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid);
  var boundingSphere = new Cesium.BoundingSphere();
  var newBoundingSphere = Cesium.BoundingSphere.transformWithoutScale(boundingSphere, modelMatrix);
    BoundingSphere.transformWithoutScale = function(sphere, transform) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object('sphere', sphere);
      Check.typeOf.object('transform', transform);
      //>>includeEnd('debug');

      if (!defined(this)) {
        this = new BoundingSphere();
      }

      this.center = Matrix4.multiplyByPoint(transform, sphere.center, this.center);
      this.radius = sphere.radius;

      return this;
    };
  */

/*
  var scratchVector3 = new Vector3();
  The distances calculated by the vector from the center of the bounding sphere to position projected onto direction
  plus/minus the radius of the bounding sphere.
  <br>
  If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the
  closest and farthest planes from position that intersect the bounding sphere.
     *
  @param {BoundingSphere} sphere The bounding sphere to calculate the distance to.
  @param {Vector3} position The position to calculate the distance from.
  @param {Vector3} direction The direction from position.
  @param {Interval} [this] A Interval to store the nearest and farthest distances.
  @returns {Interval} The nearest and farthest distances on the bounding sphere from position in direction.
    BoundingSphere.computePlaneDistances = function(sphere, position, direction) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object('sphere', sphere);
      Check.typeOf.object('position', position);
      Check.typeOf.object('direction', direction);
      //>>includeEnd('debug');

      if (!defined(this)) {
        this = new Interval();
      }

      var toCenter = Vector3.subtract(sphere.center, position, scratchVector3);
      var mag = Vector3.dot(direction, toCenter);

      this.start = mag - sphere.radius;
      this.stop = mag + sphere.radius;
      return this;
    };

    var projectTo2DNormalScratch = new Vector3();
    var projectTo2DEastScratch = new Vector3();
    var projectTo2DNorthScratch = new Vector3();
    var projectTo2DWestScratch = new Vector3();
    var projectTo2DSouthScratch = new Vector3();
    var projectTo2DCartographicScratch = new Cartographic();
    var projectTo2DPositionsScratch = new Array(8);
    for (var n = 0; n < 8; ++n) {
      projectTo2DPositionsScratch[n] = new Vector3();
    }

    var projectTo2DProjection = new GeographicProjection();
    */

/*
  Creates a bounding sphere in 2D from a bounding sphere in 3D world coordinates.
     *
  @param {BoundingSphere} sphere The bounding sphere to transform to 2D.
  @param {Object} [projection=GeographicProjection] The projection to 2D.
  @returns {BoundingSphere} The modified this parameter or a new BoundingSphere instance if none was provided.
  BoundingSphere.projectTo2D = function(sphere, projection) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('sphere', sphere);
    //>>includeEnd('debug');

    projection = defaultValue(projection, projectTo2DProjection);

    var ellipsoid = projection.ellipsoid;
    var center = sphere.center;
    var radius = sphere.radius;

    var normal = ellipsoid.geodeticSurfaceNormal(center, projectTo2DNormalScratch);
    var east = Vector3.cross(Vector3.UNIT_Z, normal, projectTo2DEastScratch);
    Vector3.normalize(east, east);
    var north = Vector3.cross(normal, east, projectTo2DNorthScratch);
    Vector3.normalize(north, north);

    Vector3.multiplyByScalar(normal, radius, normal);
    Vector3.multiplyByScalar(north, radius, north);
    Vector3.multiplyByScalar(east, radius, east);

    var south = Vector3.negate(north, projectTo2DSouthScratch);
    var west = Vector3.negate(east, projectTo2DWestScratch);

    var positions = projectTo2DPositionsScratch;

    // top NE corner
    var corner = positions[0];
    Vector3.add(normal, north, corner);
    Vector3.add(corner, east, corner);

    // top NW corner
    corner = positions[1];
    Vector3.add(normal, north, corner);
    Vector3.add(corner, west, corner);

    // top SW corner
    corner = positions[2];
    Vector3.add(normal, south, corner);
    Vector3.add(corner, west, corner);

    // top SE corner
    corner = positions[3];
    Vector3.add(normal, south, corner);
    Vector3.add(corner, east, corner);

    Vector3.negate(normal, normal);

    // bottom NE corner
    corner = positions[4];
    Vector3.add(normal, north, corner);
    Vector3.add(corner, east, corner);

    // bottom NW corner
    corner = positions[5];
    Vector3.add(normal, north, corner);
    Vector3.add(corner, west, corner);

    // bottom SW corner
    corner = positions[6];
    Vector3.add(normal, south, corner);
    Vector3.add(corner, west, corner);

    // bottom SE corner
    corner = positions[7];
    Vector3.add(normal, south, corner);
    Vector3.add(corner, east, corner);

    var length = positions.length;
    for (var i = 0; i < length; ++i) {
      var position = positions[i];
      Vector3.add(center, position, position);
      var cartographic = ellipsoid.cartesianToCartographic(position, projectTo2DCartographicScratch);
      projection.project(cartographic, position);
    }

    this = BoundingSphere.fromPoints(positions, this);

    // swizzle center components
    center = this.center;
    var x = center.x;
    var y = center.y;
    var z = center.z;
    center.x = z;
    center.y = x;
    center.z = y;

    return this;
  };

Determines whether or not a sphere is hidden from view by the occluder.
   *
@param {BoundingSphere} sphere The bounding sphere surrounding the occludee object.
@param {Occluder} occluder The occluder.
@returns {Boolean} <code>true</code> if the sphere is not visible; otherwise <code>false</code>.
  BoundingSphere.isOccluded = function(sphere, occluder) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('sphere', sphere);
    Check.typeOf.object('occluder', occluder);
    //>>includeEnd('debug');
    return !occluder.isBoundingSphereVisible(sphere);
  };
*/
