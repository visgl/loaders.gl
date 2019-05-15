// Computes an OrientedBoundingBox that bounds a {@link Rectangle} on the surface of an {@link Ellipsoid}.
// There are no guarantees about the orientation of the bounding box.

/* eslint-disable */

export default function makeBoundingBoxFromRectangle(
  rectangle,
  minimumHeight,
  maximumHeight,
  ellipsoid,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(rectangle)) {
    throw new DeveloperError('rectangle is required');
  }
  if (rectangle.width < 0.0 || rectangle.width > CesiumMath.TWO_PI) {
    throw new DeveloperError('Rectangle width must be between 0 and 2*pi');
  }
  if (rectangle.height < 0.0 || rectangle.height > CesiumMath.PI) {
    throw new DeveloperError('Rectangle height must be between 0 and pi');
  }
  if (
    defined(ellipsoid) &&
    !CesiumMath.equalsEpsilon(ellipsoid.radii.x, ellipsoid.radii.y, CesiumMath.EPSILON15)
  ) {
    throw new DeveloperError('Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)');
  }
  //>>includeEnd('debug');

  minimumHeight = defaultValue(minimumHeight, 0.0);
  maximumHeight = defaultValue(maximumHeight, 0.0);
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  // The bounding box will be aligned with the tangent plane at the center of the rectangle.
  var tangentPointCartographic = Rectangle.center(rectangle, scratchRectangleCenterCartographic);
  var tangentPoint = ellipsoid.cartographicToVector(
    tangentPointCartographic,
    scratchRectangleCenter
  );
  var tangentPlane = new EllipsoidTangentPlane(tangentPoint, ellipsoid);
  var plane = tangentPlane.plane;

  // Corner arrangement:
  //          N/+y
  //      [0] [1] [2]
  // W/-x [7]     [3] E/+x
  //      [6] [5] [4]
  //          S/-y
  // "C" refers to the central lat/long, which by default aligns with the tangent point (above).
  // If the rectangle spans the equator, CW and CE are instead aligned with the equator.
  var perimeterNW = perimeterCartographicScratch[0];
  var perimeterNC = perimeterCartographicScratch[1];
  var perimeterNE = perimeterCartographicScratch[2];
  var perimeterCE = perimeterCartographicScratch[3];
  var perimeterSE = perimeterCartographicScratch[4];
  var perimeterSC = perimeterCartographicScratch[5];
  var perimeterSW = perimeterCartographicScratch[6];
  var perimeterCW = perimeterCartographicScratch[7];

  var lonCenter = tangentPointCartographic.longitude;
  var latCenter =
    rectangle.south < 0.0 && rectangle.north > 0.0 ? 0.0 : tangentPointCartographic.latitude;
  perimeterSW.latitude = perimeterSC.latitude = perimeterSE.latitude = rectangle.south;
  perimeterCW.latitude = perimeterCE.latitude = latCenter;
  perimeterNW.latitude = perimeterNC.latitude = perimeterNE.latitude = rectangle.north;
  perimeterSW.longitude = perimeterCW.longitude = perimeterNW.longitude = rectangle.west;
  perimeterSC.longitude = perimeterNC.longitude = lonCenter;
  perimeterSE.longitude = perimeterCE.longitude = perimeterNE.longitude = rectangle.east;

  // Compute XY extents using the rectangle at maximum height
  perimeterNE.height = perimeterNC.height = perimeterNW.height = perimeterCW.height = perimeterSW.height = perimeterSC.height = perimeterSE.height = perimeterCE.height = maximumHeight;

  ellipsoid.cartographicArrayToVectorArray(perimeterCartographicScratch, perimeterVectorScratch);
  tangentPlane.projectPointsToNearestOnPlane(perimeterVectorScratch, perimeterProjectedScratch);
  // See the `perimeterXX` definitions above for what these are
  var minX = Math.min(
    perimeterProjectedScratch[6].x,
    perimeterProjectedScratch[7].x,
    perimeterProjectedScratch[0].x
  );
  var maxX = Math.max(
    perimeterProjectedScratch[2].x,
    perimeterProjectedScratch[3].x,
    perimeterProjectedScratch[4].x
  );
  var minY = Math.min(
    perimeterProjectedScratch[4].y,
    perimeterProjectedScratch[5].y,
    perimeterProjectedScratch[6].y
  );
  var maxY = Math.max(
    perimeterProjectedScratch[0].y,
    perimeterProjectedScratch[1].y,
    perimeterProjectedScratch[2].y
  );

  // Compute minimum Z using the rectangle at minimum height
  perimeterNE.height = perimeterNW.height = perimeterSE.height = perimeterSW.height = minimumHeight;
  ellipsoid.cartographicArrayToVectorArray(perimeterCartographicScratch, perimeterVectorScratch);
  var minZ = Math.min(
    Plane.getPointDistance(plane, perimeterVectorScratch[0]),
    Plane.getPointDistance(plane, perimeterVectorScratch[2]),
    Plane.getPointDistance(plane, perimeterVectorScratch[4]),
    Plane.getPointDistance(plane, perimeterVectorScratch[6])
  );
  var maxZ = maximumHeight; // Since the tangent plane touches the surface at height = 0, this is okay

  return fromTangentPlaneExtents(tangentPlane, minX, maxX, minY, maxY, minZ, maxZ, result);
}

/**
 * Computes an OrientedBoundingBox given extents in the east-north-up space of the tangent plane.
 *
 * @param {Plane} tangentPlane The tangent place corresponding to east-north-up.
 * @param {Number} minimumX Minimum X extent in tangent plane space.
 * @param {Number} maximumX Maximum X extent in tangent plane space.
 * @param {Number} minimumY Minimum Y extent in tangent plane space.
 * @param {Number} maximumY Maximum Y extent in tangent plane space.
 * @param {Number} minimumZ Minimum Z extent in tangent plane space.
 * @param {Number} maximumZ Maximum Z extent in tangent plane space.
 * @param {OrientedBoundingBox} [result] The object onto which to store the result.
 * @returns {OrientedBoundingBox} The modified result parameter or a new OrientedBoundingBox instance if one was not provided.
 */
function fromTangentPlaneExtents(
  tangentPlane,
  minimumX,
  maximumX,
  minimumY,
  maximumY,
  minimumZ,
  maximumZ,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(minimumX) ||
    !defined(maximumX) ||
    !defined(minimumY) ||
    !defined(maximumY) ||
    !defined(minimumZ) ||
    !defined(maximumZ)
  ) {
    throw new DeveloperError('all extents (minimum/maximum X/Y/Z) are required.');
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  var halfAxes = result.halfAxes;
  Matrix3.setColumn(halfAxes, 0, tangentPlane.xAxis, halfAxes);
  Matrix3.setColumn(halfAxes, 1, tangentPlane.yAxis, halfAxes);
  Matrix3.setColumn(halfAxes, 2, tangentPlane.zAxis, halfAxes);

  var centerOffset = scratchOffset;
  centerOffset.x = (minimumX + maximumX) / 2.0;
  centerOffset.y = (minimumY + maximumY) / 2.0;
  centerOffset.z = (minimumZ + maximumZ) / 2.0;

  var scale = scratchScale;
  scale.x = (maximumX - minimumX) / 2.0;
  scale.y = (maximumY - minimumY) / 2.0;
  scale.z = (maximumZ - minimumZ) / 2.0;

  var center = result.center;
  centerOffset = Matrix3.multiplyByVector(halfAxes, centerOffset, centerOffset);
  Vector3.add(tangentPlane.origin, centerOffset, center);
  Matrix3.multiplyByScale(halfAxes, scale, halfAxes);

  return result;
}
